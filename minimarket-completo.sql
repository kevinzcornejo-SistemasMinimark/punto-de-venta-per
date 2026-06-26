-- =====================================================================
-- 🛒 POS MINIMARKET — BASE DE DATOS COMPLETA (Supabase / PostgreSQL)
-- Copiar y pegar TODO este archivo en el SQL Editor de Supabase.
-- Idempotente: puede ejecutarse varias veces sin romper datos.
-- =====================================================================

create extension if not exists "pgcrypto";

-- =========================== ROLES / USUARIOS ========================
create table if not exists public.roles_usuario (
  usuario_id uuid primary key references auth.users(id) on delete cascade,
  rol text not null check (rol in ('administrador','cajero','almacenero','supervisor')) default 'cajero',
  nombre text,
  activo boolean default true,
  creado_en timestamptz default now()
);

create or replace function public.es_admin(uid uuid) returns boolean
language sql stable security definer as $$
  select exists (select 1 from public.roles_usuario where usuario_id = uid and rol = 'administrador');
$$;

-- =========================== TIENDAS / SUCURSALES ====================
create table if not exists public.tiendas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  direccion text,
  ruc text,
  telefono text,
  email text,
  logo_url text,
  moneda text default 'PEN',
  igv numeric(5,2) default 18.00,
  activa boolean default true,
  creada_en timestamptz default now()
);

create table if not exists public.terminales (
  id uuid primary key default gen_random_uuid(),
  tienda_id uuid references public.tiendas(id) on delete cascade,
  nombre text not null,
  serie_boleta text default 'B001',
  serie_factura text default 'F001',
  serie_ticket text default 'T001',
  activa boolean default true
);

-- =========================== CATÁLOGO =================================
create table if not exists public.categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  icono text,
  color text,
  orden int default 0,
  activa boolean default true,
  creada_en timestamptz default now()
);

create table if not exists public.proveedores (
  id uuid primary key default gen_random_uuid(),
  ruc text,
  razon_social text not null,
  contacto text,
  telefono text,
  email text,
  direccion text,
  activo boolean default true,
  creado_en timestamptz default now()
);

create table if not exists public.productos (
  id uuid primary key default gen_random_uuid(),
  codigo_barras text unique,
  nombre text not null,
  descripcion text,
  categoria_id uuid references public.categorias(id) on delete set null,
  proveedor_id uuid references public.proveedores(id) on delete set null,
  unidad text default 'unidad',
  precio_compra numeric(12,2) default 0,
  precio_venta numeric(12,2) not null default 0,
  stock numeric(12,3) default 0,
  stock_minimo numeric(12,3) default 5,
  afecto_igv boolean default true,
  imagen_url text,
  activo boolean default true,
  creado_en timestamptz default now(),
  actualizado_en timestamptz default now()
);
create index if not exists idx_productos_categoria on public.productos(categoria_id);
create index if not exists idx_productos_codigo on public.productos(codigo_barras);

-- =========================== LOTES / KARDEX ===========================
create table if not exists public.lotes (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.productos(id) on delete cascade,
  codigo_lote text,
  fecha_vencimiento date,
  cantidad numeric(12,3) not null default 0,
  costo_unitario numeric(12,2) default 0,
  creado_en timestamptz default now()
);

create table if not exists public.kardex (
  id bigserial primary key,
  producto_id uuid not null references public.productos(id) on delete cascade,
  tipo text not null check (tipo in ('ENTRADA','SALIDA','AJUSTE','VENTA','COMPRA','DEVOLUCION')),
  cantidad numeric(12,3) not null,
  saldo numeric(12,3),
  costo_unitario numeric(12,2),
  documento text,
  motivo text,
  usuario_id uuid references auth.users(id),
  creado_en timestamptz default now()
);
create index if not exists idx_kardex_producto on public.kardex(producto_id, creado_en desc);

create table if not exists public.ajustes_inventario (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.productos(id) on delete cascade,
  cantidad numeric(12,3) not null,
  motivo text,
  usuario_id uuid references auth.users(id),
  creado_en timestamptz default now()
);

-- =========================== CLIENTES =================================
create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  tipo_doc text default 'DNI' check (tipo_doc in ('DNI','RUC','CE','PASAPORTE','OTRO')),
  documento text,
  nombre text not null,
  email text,
  telefono text,
  direccion text,
  puntos int default 0,
  activo boolean default true,
  creado_en timestamptz default now()
);
create unique index if not exists uq_clientes_doc on public.clientes(tipo_doc, documento) where documento is not null;

-- =========================== VENTAS ===================================
create table if not exists public.ventas (
  id uuid primary key default gen_random_uuid(),
  tienda_id uuid references public.tiendas(id) on delete set null,
  terminal_id uuid references public.terminales(id) on delete set null,
  serie text not null,
  correlativo bigint not null,
  tipo_comprobante text not null check (tipo_comprobante in ('BOLETA','FACTURA','TICKET','NOTA_CREDITO')),
  cliente_id uuid references public.clientes(id) on delete set null,
  cajero_id uuid references auth.users(id),
  subtotal numeric(12,2) not null default 0,
  igv numeric(12,2) not null default 0,
  descuento numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  metodo_pago text not null default 'EFECTIVO',
  estado text not null default 'EMITIDA' check (estado in ('EMITIDA','ANULADA','PENDIENTE')),
  observacion text,
  creada_en timestamptz default now(),
  unique (serie, correlativo, tipo_comprobante)
);
create index if not exists idx_ventas_fecha on public.ventas(creada_en desc);

create table if not exists public.venta_items (
  id bigserial primary key,
  venta_id uuid not null references public.ventas(id) on delete cascade,
  producto_id uuid references public.productos(id) on delete set null,
  nombre text not null,
  cantidad numeric(12,3) not null,
  precio_unitario numeric(12,2) not null,
  descuento numeric(12,2) default 0,
  subtotal numeric(12,2) not null,
  igv numeric(12,2) default 0,
  total numeric(12,2) not null
);
create index if not exists idx_venta_items_venta on public.venta_items(venta_id);

create table if not exists public.venta_pagos (
  id bigserial primary key,
  venta_id uuid not null references public.ventas(id) on delete cascade,
  metodo text not null,
  monto numeric(12,2) not null,
  referencia text,
  creado_en timestamptz default now()
);

-- =========================== COMPRAS ==================================
create table if not exists public.compras (
  id uuid primary key default gen_random_uuid(),
  proveedor_id uuid references public.proveedores(id) on delete set null,
  documento text,
  subtotal numeric(12,2) default 0,
  igv numeric(12,2) default 0,
  total numeric(12,2) default 0,
  estado text default 'RECIBIDA' check (estado in ('PENDIENTE','RECIBIDA','ANULADA')),
  usuario_id uuid references auth.users(id),
  creada_en timestamptz default now()
);
create table if not exists public.compra_items (
  id bigserial primary key,
  compra_id uuid not null references public.compras(id) on delete cascade,
  producto_id uuid references public.productos(id) on delete set null,
  nombre text not null,
  cantidad numeric(12,3) not null,
  costo_unitario numeric(12,2) not null,
  subtotal numeric(12,2) not null
);

-- =========================== CAJA / GASTOS ============================
create table if not exists public.caja_sesiones (
  id uuid primary key default gen_random_uuid(),
  terminal_id uuid references public.terminales(id) on delete set null,
  usuario_id uuid references auth.users(id),
  apertura numeric(12,2) not null default 0,
  cierre numeric(12,2),
  estado text default 'ABIERTA' check (estado in ('ABIERTA','CERRADA')),
  abierta_en timestamptz default now(),
  cerrada_en timestamptz
);

create table if not exists public.caja_movimientos (
  id bigserial primary key,
  sesion_id uuid references public.caja_sesiones(id) on delete cascade,
  tipo text not null check (tipo in ('INGRESO','EGRESO','VENTA','RETIRO')),
  monto numeric(12,2) not null,
  motivo text,
  usuario_id uuid references auth.users(id),
  creado_en timestamptz default now()
);

create table if not exists public.gastos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default current_date,
  categoria text,
  descripcion text not null,
  monto numeric(12,2) not null,
  proveedor_id uuid references public.proveedores(id) on delete set null,
  usuario_id uuid references auth.users(id),
  creado_en timestamptz default now()
);

-- =========================== COMBOS / ETIQUETAS =======================
create table if not exists public.combos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  precio numeric(12,2) not null,
  activo boolean default true,
  creado_en timestamptz default now()
);
create table if not exists public.combo_items (
  id bigserial primary key,
  combo_id uuid not null references public.combos(id) on delete cascade,
  producto_id uuid not null references public.productos(id) on delete cascade,
  cantidad numeric(12,3) not null default 1
);

create table if not exists public.etiquetas (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid references public.productos(id) on delete cascade,
  formato text default '50x30',
  cantidad int default 1,
  impreso boolean default false,
  creado_en timestamptz default now()
);

-- =========================== CONFIGURACIÓN ============================
create table if not exists public.configuracion (
  clave text primary key,
  valor jsonb not null default '{}'::jsonb,
  actualizada_en timestamptz default now()
);

create table if not exists public.licencia (
  id uuid primary key default gen_random_uuid(),
  clave text unique,
  plan text default 'free',
  expira_en date,
  activo boolean default true,
  creada_en timestamptz default now()
);

create table if not exists public.log_auditoria (
  id bigserial primary key,
  usuario_id uuid references auth.users(id),
  accion text not null,
  entidad text,
  entidad_id text,
  detalle jsonb,
  ip text,
  creado_en timestamptz default now()
);


-- =========================== COMPATIBILIDAD (tablas antiguas) =========
-- Agrega columnas faltantes en instalaciones previas sin romper datos.
alter table public.clientes     add column if not exists tipo_doc text default 'DNI';
alter table public.clientes     add column if not exists documento text;
alter table public.clientes     add column if not exists email text;
alter table public.clientes     add column if not exists telefono text;
alter table public.clientes     add column if not exists direccion text;
alter table public.clientes     add column if not exists puntos int default 0;
alter table public.clientes     add column if not exists activo boolean default true;
alter table public.clientes     add column if not exists creado_en timestamptz default now();

alter table public.productos    add column if not exists codigo_barras text;
alter table public.productos    add column if not exists descripcion text;
alter table public.productos    add column if not exists categoria_id uuid;
alter table public.productos    add column if not exists proveedor_id uuid;
alter table public.productos    add column if not exists unidad text default 'unidad';
alter table public.productos    add column if not exists precio_compra numeric(12,2) default 0;
alter table public.productos    add column if not exists precio_venta numeric(12,2) default 0;
alter table public.productos    add column if not exists stock numeric(12,3) default 0;
alter table public.productos    add column if not exists stock_minimo numeric(12,3) default 5;
alter table public.productos    add column if not exists afecto_igv boolean default true;
alter table public.productos    add column if not exists imagen_url text;
alter table public.productos    add column if not exists activo boolean default true;
alter table public.productos    add column if not exists creado_en timestamptz default now();
alter table public.productos    add column if not exists actualizado_en timestamptz default now();

alter table public.categorias   add column if not exists icono text;
alter table public.categorias   add column if not exists color text;
alter table public.categorias   add column if not exists orden int default 0;
alter table public.categorias   add column if not exists activa boolean default true;
alter table public.categorias   add column if not exists creada_en timestamptz default now();

alter table public.proveedores  add column if not exists ruc text;
alter table public.proveedores  add column if not exists contacto text;
alter table public.proveedores  add column if not exists telefono text;
alter table public.proveedores  add column if not exists email text;
alter table public.proveedores  add column if not exists direccion text;
alter table public.proveedores  add column if not exists activo boolean default true;
alter table public.proveedores  add column if not exists creado_en timestamptz default now();

alter table public.ventas       add column if not exists tienda_id uuid;
alter table public.ventas       add column if not exists terminal_id uuid;
alter table public.ventas       add column if not exists descuento numeric(12,2) default 0;
alter table public.ventas       add column if not exists metodo_pago text default 'EFECTIVO';
alter table public.ventas       add column if not exists estado text default 'EMITIDA';
alter table public.ventas       add column if not exists observacion text;


-- =========================== TRIGGERS =================================
create or replace function public.trg_actualizado_en() returns trigger
language plpgsql as $$
begin new.actualizado_en := now(); return new; end $$;

drop trigger if exists tr_productos_upd on public.productos;
create trigger tr_productos_upd before update on public.productos
for each row execute function public.trg_actualizado_en();

-- Descuento de stock automático al insertar item de venta
create or replace function public.trg_venta_item_stock() returns trigger
language plpgsql as $$
begin
  if new.producto_id is not null then
    update public.productos set stock = stock - new.cantidad where id = new.producto_id;
    insert into public.kardex(producto_id, tipo, cantidad, documento, motivo)
      values (new.producto_id, 'VENTA', -new.cantidad, new.venta_id::text, 'Venta automática');
  end if;
  return new;
end $$;

drop trigger if exists tr_venta_item_stock on public.venta_items;
create trigger tr_venta_item_stock after insert on public.venta_items
for each row execute function public.trg_venta_item_stock();


-- Refuerzo: garantizar columnas críticas en productos antes de crear vistas
alter table public.productos add column if not exists stock numeric(12,3) default 0;
alter table public.productos add column if not exists stock_minimo numeric(12,3) default 5;
alter table public.productos add column if not exists activo boolean default true;
alter table public.productos add column if not exists categoria_id uuid;
update public.productos set stock = 0 where stock is null;
update public.productos set stock_minimo = 5 where stock_minimo is null;
update public.productos set activo = true where activo is null;

-- =========================== VISTAS ÚTILES ============================
drop view if exists public.v_stock_bajo cascade;
create or replace view public.v_stock_bajo as
  select p.*, coalesce(c.nombre,'Sin categoría') as categoria
  from public.productos p
  left join public.categorias c on c.id = p.categoria_id
  where p.activo and p.stock <= p.stock_minimo;

drop view if exists public.v_ventas_dia cascade;
create or replace view public.v_ventas_dia as
  select date(creada_en) as dia, count(*) as transacciones,
         sum(total) as total_ventas, sum(igv) as total_igv
  from public.ventas where estado <> 'ANULADA'
  group by date(creada_en) order by dia desc;

drop view if exists public.v_top_productos cascade;
create or replace view public.v_top_productos as
  select vi.producto_id, vi.nombre,
         sum(vi.cantidad) as unidades, sum(vi.total) as monto
  from public.venta_items vi
  join public.ventas v on v.id = vi.venta_id
  where v.estado <> 'ANULADA'
  group by vi.producto_id, vi.nombre
  order by unidades desc;

-- =========================== RLS ======================================
alter table public.roles_usuario enable row level security;
alter table public.tiendas enable row level security;
alter table public.terminales enable row level security;
alter table public.categorias enable row level security;
alter table public.proveedores enable row level security;
alter table public.productos enable row level security;
alter table public.lotes enable row level security;
alter table public.kardex enable row level security;
alter table public.ajustes_inventario enable row level security;
alter table public.clientes enable row level security;
alter table public.ventas enable row level security;
alter table public.venta_items enable row level security;
alter table public.venta_pagos enable row level security;
alter table public.compras enable row level security;
alter table public.compra_items enable row level security;
alter table public.caja_sesiones enable row level security;
alter table public.caja_movimientos enable row level security;
alter table public.gastos enable row level security;
alter table public.combos enable row level security;
alter table public.combo_items enable row level security;
alter table public.etiquetas enable row level security;
alter table public.configuracion enable row level security;
alter table public.licencia enable row level security;
alter table public.log_auditoria enable row level security;

do $$
declare t text;
begin
  for t in select unnest(array[
    'roles_usuario','tiendas','terminales','categorias','proveedores','productos',
    'lotes','kardex','ajustes_inventario','clientes','ventas','venta_items','venta_pagos',
    'compras','compra_items','caja_sesiones','caja_movimientos','gastos','combos','combo_items',
    'etiquetas','configuracion','licencia','log_auditoria'
  ]) loop
    execute format('drop policy if exists "auth_read_%1$s" on public.%1$I', t);
    execute format('drop policy if exists "auth_write_%1$s" on public.%1$I', t);
    execute format('create policy "auth_read_%1$s" on public.%1$I for select to authenticated using (true)', t);
    execute format('create policy "auth_write_%1$s" on public.%1$I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- =========================== DATOS DEMO ===============================
insert into public.tiendas(nombre, direccion, ruc, telefono)
values ('Mi Minimarket', 'Av. Principal 123', '20123456789', '+51 999 999 999')
on conflict do nothing;

insert into public.categorias(nombre, icono, color, orden) values
  ('Abarrotes','ShoppingBasket','#10b981',1),
  ('Bebidas','CupSoda','#0ea5e9',2),
  ('Lácteos','Milk','#f59e0b',3),
  ('Panadería','Croissant','#a855f7',4),
  ('Limpieza','SprayCan','#06b6d4',5),
  ('Snacks','Cookie','#ef4444',6),
  ('Carnes','Beef','#dc2626',7),
  ('Frutas','Apple','#22c55e',8)
on conflict (nombre) do nothing;

insert into public.configuracion(clave, valor) values
  ('empresa', '{"nombre":"Mi Minimarket","ruc":"20123456789","direccion":"Av. Principal 123","telefono":"+51 999 999 999","email":"contacto@minimarket.pe"}'::jsonb),
  ('ticket', '{"alto":"80mm","mensaje":"¡Gracias por su compra!","mostrar_logo":true,"copias":2}'::jsonb),
  ('apariencia', '{"tema":"claro","color":"emerald"}'::jsonb)
on conflict (clave) do nothing;

-- =====================================================================
-- 👤 PARA CREAR UN ADMINISTRADOR:
--   1) Crea el usuario en Authentication → Users (email + contraseña)
--   2) Copia su UUID y ejecuta:
--      insert into public.roles_usuario(usuario_id, rol, nombre)
--      values ('PEGA-AQUI-EL-UUID', 'administrador', 'Tu Nombre');
-- =====================================================================
