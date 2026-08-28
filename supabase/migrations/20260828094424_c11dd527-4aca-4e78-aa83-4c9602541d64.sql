create type public.order_type as enum ('dine_in', 'room_service', 'takeaway');
create type public.order_status as enum ('pending', 'confirmed', 'ready', 'completed', 'cancelled');

create table public.food_orders (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null,
  email text,
  phone text,
  room_number text,
  order_type public.order_type not null,
  status public.order_status not null default 'pending',
  notes text,
  total_ghs numeric not null default 0,
  reference_code text not null unique,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

grant insert on public.food_orders to anon;
grant select, insert, update on public.food_orders to authenticated;
grant all on public.food_orders to service_role;

alter table public.food_orders enable row level security;

create policy "Anyone can place a food order"
on public.food_orders
for insert
 to anon, authenticated
 with check (true);

create policy "Staff can view and manage food orders"
on public.food_orders
for all
 to authenticated
 using (
   public.has_role(auth.uid(), 'admin')
   or public.has_role(auth.uid(), 'operations_manager')
   or public.has_role(auth.uid(), 'front_desk')
 )
 with check (
   public.has_role(auth.uid(), 'admin')
   or public.has_role(auth.uid(), 'operations_manager')
   or public.has_role(auth.uid(), 'front_desk')
 );

create table public.food_order_items (
  id uuid primary key default gen_random_uuid(),
  food_order_id uuid not null references public.food_orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  name text not null,
  price_ghs numeric not null,
  quantity integer not null default 1,
  line_total_ghs numeric not null,
  created_at timestamp with time zone not null default now()
);

grant insert on public.food_order_items to anon;
grant select, insert, update, delete on public.food_order_items to authenticated;
grant all on public.food_order_items to service_role;

alter table public.food_order_items enable row level security;

create policy "Anyone can add food order items"
on public.food_order_items
for insert
 to anon, authenticated
 with check (true);

create policy "Staff can manage food order items"
on public.food_order_items
for all
 to authenticated
 using (
   public.has_role(auth.uid(), 'admin')
   or public.has_role(auth.uid(), 'operations_manager')
   or public.has_role(auth.uid(), 'front_desk')
 )
 with check (
   public.has_role(auth.uid(), 'admin')
   or public.has_role(auth.uid(), 'operations_manager')
   or public.has_role(auth.uid(), 'front_desk')
 );

create or replace function public.update_food_orders_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_food_orders_updated_at
before update on public.food_orders
for each row execute function public.update_food_orders_updated_at();

alter publication supabase_realtime add table public.food_orders;
alter publication supabase_realtime add table public.food_order_items;