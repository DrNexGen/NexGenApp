-- ============================================================
-- Anugiri Dental Clinic — Supabase setup
-- Run once in: Supabase Dashboard -> SQL Editor -> New query
--
-- IMPORTANT: change BOTH passcodes on the marked lines below!
--   staff passcode  -> assistants use it (bookings, reports upload)
--   admin passcode  -> Dr. Revathi only (money reports, export, delete)
-- ============================================================

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null default '',
  phone text not null,
  age int check (age between 0 and 120),
  gender text,
  medical_alerts text,
  address text,
  created_at timestamptz not null default now()
);

create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor text,
  visit_at timestamptz not null default now(),
  category text not null,
  affected_area text,
  treatment_details text,
  fee_charged numeric(12,2) not null default 0,
  payment_received numeric(12,2) not null default 0,
  payment_mode text,
  next_appointment timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

-- New columns for the ortho/physio version (safe to re-run).
alter table public.visits add column if not exists doctor text;
alter table public.visits add column if not exists affected_area text;

-- Report files are stored as base64 in "data" (images are compressed
-- client-side to ~200 KB, so the free 500 MB database fits ~2,000+ reports)
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  visit_id uuid references public.visits(id) on delete cascade,
  report_date date not null default current_date,
  report_name text not null,
  mime text not null,
  data text not null,
  created_at timestamptz not null default now()
);

-- Link reports to a specific consultation (safe to re-run).
alter table public.reports add column if not exists visit_id uuid references public.visits(id) on delete cascade;

create table if not exists public.app_secrets (
  key text primary key,
  value text not null
);

-- >>> CHANGE THESE TWO PASSCODES (first run only; re-running this file
-- never overwrites passcodes you changed later) <<<
insert into public.app_secrets (key, value) values
  ('staff_passcode', 'CHANGE-STAFF-1234'),
  ('admin_passcode', 'CHANGE-ADMIN-9999')
on conflict (key) do nothing;

-- Lock everything down: RLS on, and NO policies at all.
-- Clients can only go through the functions below (patient data is
-- medical data — nothing is publicly readable).
alter table public.patients enable row level security;
alter table public.visits enable row level security;
alter table public.reports enable row level security;
alter table public.app_secrets enable row level security;

-- Staff check: the staff passcode OR the admin passcode is accepted
create or replace function public._check_staff(p_code text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from app_secrets
    where key in ('staff_passcode', 'admin_passcode') and value = p_code
  ) then
    raise exception 'Incorrect passcode';
  end if;
end; $$;

-- Admin check: only the admin passcode
create or replace function public._check_admin(p_code text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from app_secrets where key = 'admin_passcode' and value = p_code
  ) then
    raise exception 'Admin passcode required';
  end if;
end; $$;

-- Returns the role for a passcode: 'admin', 'staff', or null
drop function if exists public.verify_passcode(text);
create or replace function public.verify_passcode(p_passcode text)
returns text language sql security definer set search_path = public as $$
  select case
    when exists (select 1 from app_secrets where key = 'admin_passcode' and value = p_passcode) then 'admin'
    when exists (select 1 from app_secrets where key = 'staff_passcode' and value = p_passcode) then 'staff'
    else null
  end;
$$;

-- ---------- Patients ----------

create or replace function public.list_patients(p_passcode text, p_search text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  perform _check_staff(p_passcode);
  return coalesce((
    -- Patients with a sooner upcoming appointment first; those with none last.
    select jsonb_agg(row_to_json(t)::jsonb
             order by t.next_appointment asc nulls last, t.first_name, t.last_name)
    from (
      select p.id, p.first_name, p.last_name, p.phone, p.age, p.gender,
             p.medical_alerts, p.address,
             s.c  as total_visits,
             s.ch as total_charged,
             s.rec as total_received,
             (s.ch - s.rec) as balance_due,
             s.lv as last_visit,
             na.next_appointment
      from patients p
      left join lateral (
        select count(*) c,
               coalesce(sum(fee_charged), 0) ch,
               coalesce(sum(payment_received), 0) rec,
               max(visit_at) lv
        from visits v where v.patient_id = p.id
      ) s on true
      left join lateral (
        select min(d) as next_appointment
        from (
          select visit_at as d from visits where patient_id = p.id and visit_at >= now()
          union all
          select next_appointment as d from visits where patient_id = p.id and next_appointment >= now()
        ) u
      ) na on true
      where p_search is null or p_search = ''
         or (p.first_name || ' ' || p.last_name) ilike '%' || p_search || '%'
         or p.phone like '%' || p_search || '%'
    ) t
  ), '[]'::jsonb);
end; $$;

create or replace function public.get_patient(p_passcode text, p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  perform _check_staff(p_passcode);
  return jsonb_build_object(
    'patient', (select row_to_json(p)::jsonb from patients p where p.id = p_id),
    'visits', coalesce((
      select jsonb_agg(row_to_json(v)::jsonb order by v.visit_at desc)
      from visits v where v.patient_id = p_id
    ), '[]'::jsonb),
    'reports', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id, 'visit_id', r.visit_id, 'report_date', r.report_date,
        'report_name', r.report_name, 'mime', r.mime) order by r.report_date desc)
      from reports r where r.patient_id = p_id
    ), '[]'::jsonb)
  );
end; $$;

create or replace function public.create_patient(
  p_passcode text, p_first_name text, p_last_name text, p_phone text,
  p_age int, p_gender text, p_medical_alerts text, p_address text
) returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  perform _check_staff(p_passcode);
  insert into patients (first_name, last_name, phone, age, gender, medical_alerts, address)
  values (p_first_name, coalesce(p_last_name, ''), p_phone, p_age, p_gender, p_medical_alerts, p_address)
  returning id into new_id;
  return new_id;
end; $$;

create or replace function public.update_patient(
  p_passcode text, p_id uuid, p_first_name text, p_last_name text, p_phone text,
  p_age int, p_gender text, p_medical_alerts text, p_address text
) returns void language plpgsql security definer set search_path = public as $$
begin
  perform _check_staff(p_passcode);
  update patients set first_name = p_first_name, last_name = coalesce(p_last_name, ''),
    phone = p_phone, age = p_age, gender = p_gender,
    medical_alerts = p_medical_alerts, address = p_address
  where id = p_id;
end; $$;

create or replace function public.delete_patient(p_admin_passcode text, p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _check_admin(p_admin_passcode);
  delete from patients where id = p_id;
end; $$;

-- ---------- Visits ----------

drop function if exists public.add_visit(text, uuid, timestamptz, text, text, text, numeric, numeric, text, timestamptz, text);
create or replace function public.add_visit(
  p_passcode text, p_patient_id uuid, p_doctor text, p_visit_at timestamptz, p_category text,
  p_affected_area text, p_treatment_details text, p_fee_charged numeric,
  p_payment_received numeric, p_payment_mode text, p_next_appointment timestamptz, p_notes text
) returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  perform _check_staff(p_passcode);
  insert into visits (patient_id, doctor, visit_at, category, affected_area, treatment_details,
    fee_charged, payment_received, payment_mode, next_appointment, notes)
  values (p_patient_id, p_doctor, p_visit_at, p_category, p_affected_area, p_treatment_details,
    p_fee_charged, p_payment_received, p_payment_mode, p_next_appointment, p_notes)
  returning id into new_id;
  return new_id;
end; $$;

drop function if exists public.update_visit(text, uuid, timestamptz, text, text, text, numeric, numeric, text, timestamptz, text);
create or replace function public.update_visit(
  p_passcode text, p_id uuid, p_doctor text, p_visit_at timestamptz, p_category text,
  p_affected_area text, p_treatment_details text, p_fee_charged numeric,
  p_payment_received numeric, p_payment_mode text, p_next_appointment timestamptz, p_notes text
) returns void language plpgsql security definer set search_path = public as $$
begin
  perform _check_staff(p_passcode);
  update visits set doctor = p_doctor, visit_at = p_visit_at, category = p_category,
    affected_area = p_affected_area, treatment_details = p_treatment_details,
    fee_charged = p_fee_charged, payment_received = p_payment_received,
    payment_mode = p_payment_mode, next_appointment = p_next_appointment, notes = p_notes
  where id = p_id;
end; $$;

create or replace function public.delete_visit(p_admin_passcode text, p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _check_admin(p_admin_passcode);
  delete from visits where id = p_id;
end; $$;

-- ---------- Reports (patient files) ----------

drop function if exists public.add_report(text, uuid, date, text, text, text);
create or replace function public.add_report(
  p_passcode text, p_patient_id uuid, p_visit_id uuid, p_report_date date,
  p_report_name text, p_mime text, p_data text
) returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  perform _check_staff(p_passcode);
  if length(p_data) > 8000000 then
    raise exception 'File too large (max ~5 MB)';
  end if;
  insert into reports (patient_id, visit_id, report_date, report_name, mime, data)
  values (p_patient_id, p_visit_id, p_report_date, p_report_name, p_mime, p_data)
  returning id into new_id;
  return new_id;
end; $$;

create or replace function public.get_report(p_passcode text, p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  perform _check_staff(p_passcode);
  return (select jsonb_build_object('mime', mime, 'data', data) from reports where id = p_id);
end; $$;

create or replace function public.delete_report(p_admin_passcode text, p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _check_admin(p_admin_passcode);
  delete from reports where id = p_id;
end; $$;

-- ---------- Dashboard (all staff) ----------

create or replace function public.get_dashboard(p_passcode text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  perform _check_staff(p_passcode);
  return jsonb_build_object(
    'today', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', v.id, 'patient_id', v.patient_id,
        'patient_name', p.first_name || ' ' || p.last_name,
        'doctor', v.doctor, 'visit_at', v.visit_at, 'category', v.category,
        'payment_received', v.payment_received, 'payment_mode', v.payment_mode
      ) order by v.visit_at)
      from visits v join patients p on p.id = v.patient_id
      where v.visit_at::date = current_date
    ), '[]'::jsonb),
    'tomorrow', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', v.id, 'patient_id', v.patient_id,
        'patient_name', p.first_name || ' ' || p.last_name,
        'doctor', v.doctor, 'visit_at', v.visit_at, 'category', v.category,
        'payment_received', v.payment_received, 'payment_mode', v.payment_mode
      ) order by v.visit_at)
      from visits v join patients p on p.id = v.patient_id
      where v.visit_at::date = current_date + 1
    ), '[]'::jsonb),
    'followups', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', v.id, 'patient_id', v.patient_id,
        'patient_name', p.first_name || ' ' || p.last_name,
        'doctor', v.doctor, 'next_appointment', v.next_appointment, 'category', v.category
      ) order by v.next_appointment)
      from visits v join patients p on p.id = v.patient_id
      where v.next_appointment >= now() - interval '12 hours'
    ), '[]'::jsonb)
  );
end; $$;

-- ---------- Money reports (ADMIN ONLY) ----------

create or replace function public.get_reports_summary(p_admin_passcode text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  perform _check_admin(p_admin_passcode);
  return jsonb_build_object(
    'totals', (
      select jsonb_build_object(
        'today', coalesce(sum(payment_received) filter (where visit_at::date = current_date), 0),
        'this_month', coalesce(sum(payment_received) filter (where visit_at >= date_trunc('month', now())), 0),
        'six_months', coalesce(sum(payment_received) filter (where visit_at >= now() - interval '6 months'), 0),
        'twelve_months', coalesce(sum(payment_received) filter (where visit_at >= now() - interval '12 months'), 0),
        'all_time', coalesce(sum(payment_received), 0),
        'outstanding', coalesce(sum(fee_charged - payment_received), 0)
      ) from visits
    ),
    'monthly', coalesce((
      select jsonb_agg(jsonb_build_object('month', m, 'total', t) order by m)
      from (
        select to_char(visit_at, 'YYYY-MM') m, sum(payment_received) t
        from visits
        where visit_at >= date_trunc('month', now()) - interval '11 months'
        group by 1
      ) x
    ), '[]'::jsonb),
    'by_category', coalesce((
      select jsonb_agg(jsonb_build_object('category', category, 'visits', c, 'total', t) order by t desc)
      from (
        select category, count(*) c, sum(payment_received) t
        from visits
        where visit_at >= now() - interval '12 months'
        group by category
      ) x
    ), '[]'::jsonb),
    'by_mode', coalesce((
      select jsonb_agg(jsonb_build_object('mode', payment_mode, 'total', t) order by t desc)
      from (
        select coalesce(payment_mode, 'Unspecified') payment_mode, sum(payment_received) t
        from visits
        where visit_at >= now() - interval '12 months'
        group by 1
      ) x
    ), '[]'::jsonb),
    'by_doctor', coalesce((
      select jsonb_agg(jsonb_build_object('doctor', doctor, 'visits', c, 'total', t) order by t desc)
      from (
        select coalesce(doctor, 'Unassigned') doctor, count(*) c, sum(payment_received) t
        from visits
        where visit_at >= now() - interval '12 months'
        group by 1
      ) x
    ), '[]'::jsonb),
    'top_patients', coalesce((
      select jsonb_agg(jsonb_build_object(
        'patient_id', pid, 'patient_name', pname, 'visits', c, 'total', t) order by t desc)
      from (
        select v.patient_id pid, p.first_name || ' ' || p.last_name pname,
               count(*) c, sum(v.payment_received) t
        from visits v join patients p on p.id = v.patient_id
        where v.visit_at >= now() - interval '12 months'
        group by 1, 2
        order by sum(v.payment_received) desc
        limit 10
      ) x
    ), '[]'::jsonb)
  );
end; $$;

-- Full data export / backup (ADMIN ONLY)
create or replace function public.export_all(p_admin_passcode text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  perform _check_admin(p_admin_passcode);
  return jsonb_build_object(
    'patients', coalesce((
      select jsonb_agg(jsonb_build_object(
        'first_name', p.first_name, 'last_name', p.last_name,
        'phone', p.phone, 'age', p.age, 'gender', p.gender,
        'medical_alerts', p.medical_alerts, 'address', p.address,
        'created_at', p.created_at,
        'total_visits', s.c, 'total_charged', s.ch,
        'total_received', s.rec, 'balance_due', (s.ch - s.rec)
      ) order by p.first_name, p.last_name)
      from patients p
      left join lateral (
        select count(*) c,
               coalesce(sum(fee_charged), 0) ch,
               coalesce(sum(payment_received), 0) rec
        from visits v where v.patient_id = p.id
      ) s on true
    ), '[]'::jsonb),
    'visits', coalesce((
      select jsonb_agg(jsonb_build_object(
        'visit_at', v.visit_at,
        'patient_name', p.first_name || ' ' || p.last_name,
        'phone', p.phone,
        'doctor', v.doctor,
        'category', v.category,
        'affected_area', v.affected_area,
        'treatment_details', v.treatment_details,
        'fee_charged', v.fee_charged,
        'payment_received', v.payment_received,
        'payment_mode', v.payment_mode,
        'next_appointment', v.next_appointment,
        'notes', v.notes
      ) order by v.visit_at)
      from visits v join patients p on p.id = v.patient_id
    ), '[]'::jsonb),
    'reports', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id,
        'patient_name', p.first_name || ' ' || p.last_name,
        'report_name', r.report_name,
        'report_date', r.report_date,
        'mime', r.mime
      ) order by r.report_date)
      from reports r join patients p on p.id = r.patient_id
    ), '[]'::jsonb)
  );
end; $$;

-- ---------- Permissions for the app (anon role) ----------

grant execute on function public.verify_passcode(text) to anon;
grant execute on function public.list_patients(text, text) to anon;
grant execute on function public.get_patient(text, uuid) to anon;
grant execute on function public.create_patient(text, text, text, text, int, text, text, text) to anon;
grant execute on function public.update_patient(text, uuid, text, text, text, int, text, text, text) to anon;
grant execute on function public.delete_patient(text, uuid) to anon;
grant execute on function public.add_visit(text, uuid, text, timestamptz, text, text, text, numeric, numeric, text, timestamptz, text) to anon;
grant execute on function public.update_visit(text, uuid, text, timestamptz, text, text, text, numeric, numeric, text, timestamptz, text) to anon;
grant execute on function public.delete_visit(text, uuid) to anon;
grant execute on function public.add_report(text, uuid, uuid, date, text, text, text) to anon;
grant execute on function public.get_report(text, uuid) to anon;
grant execute on function public.delete_report(text, uuid) to anon;
grant execute on function public.get_dashboard(text) to anon;
grant execute on function public.get_reports_summary(text) to anon;
grant execute on function public.export_all(text) to anon;
revoke execute on function public._check_staff(text) from anon;
revoke execute on function public._check_admin(text) from anon;
