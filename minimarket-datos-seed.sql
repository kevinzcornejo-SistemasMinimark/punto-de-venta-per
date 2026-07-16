-- =====================================================================
-- MINIMARKET — DATOS SEMILLA (para pegar en tu nueva Supabase)
-- Requiere haber corrido antes: minimarket-completo.sql
-- Idempotente: usa ON CONFLICT en códigos/documentos únicos.
-- Orden: 1) Categorías/Productos  2) Proveedores  3) Clientes
--        4) Lotes  5) Compras demo (con detalle)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) CATEGORÍAS + PRODUCTOS (~60 productos peruanos)
-- ---------------------------------------------------------------------
INSERT INTO public.categorias (nombre) VALUES
  ('Abarrotes'), ('Bebidas'), ('Lácteos'), ('Panadería'),
  ('Limpieza'), ('Snacks'), ('Carnes'), ('Frutas'),
  ('Cuidado Personal'), ('Golosinas')
ON CONFLICT (nombre) DO NOTHING;

WITH cat AS (SELECT nombre, id FROM public.categorias)
INSERT INTO public.productos
  (codigo_barras, nombre, categoria_id, unidad, precio_compra, precio_venta, stock_actual, stock_minimo, igv, activo)
VALUES
-- ABARROTES
('7750243012345','Arroz Costeño 5kg',           (SELECT id FROM cat WHERE nombre='Abarrotes'),'bolsa', 22.00, 28.90, 40, 10, true, true),
('7750243012346','Arroz Paisana 5kg',           (SELECT id FROM cat WHERE nombre='Abarrotes'),'bolsa', 21.00, 27.50, 35, 10, true, true),
('7750243012347','Azúcar Rubia Cartavio 1kg',   (SELECT id FROM cat WHERE nombre='Abarrotes'),'kg',     3.50,  4.90, 80, 20, true, true),
('7750243012348','Aceite Primor 1L',            (SELECT id FROM cat WHERE nombre='Abarrotes'),'botella',8.50, 11.90, 50, 15, true, true),
('7750243012349','Aceite Cocinero 1L',          (SELECT id FROM cat WHERE nombre='Abarrotes'),'botella',7.80, 10.50, 45, 15, true, true),
('7750243012350','Fideos Don Vittorio 500g',    (SELECT id FROM cat WHERE nombre='Abarrotes'),'paquete',3.20,  4.50, 60, 20, true, true),
('7750243012351','Atún Florida 170g',           (SELECT id FROM cat WHERE nombre='Abarrotes'),'lata',   4.80,  6.50, 70, 20, true, true),
('7750243012352','Leche Gloria Tarro 410g',     (SELECT id FROM cat WHERE nombre='Abarrotes'),'lata',   3.80,  5.20, 90, 30, true, true),
('7750243012353','Sal Marina Emsal 1kg',        (SELECT id FROM cat WHERE nombre='Abarrotes'),'kg',     1.50,  2.50, 50, 10, true, true),
('7750243012354','Menestra Lenteja 500g',       (SELECT id FROM cat WHERE nombre='Abarrotes'),'paquete',4.20,  5.90, 40, 10, true, true),
('7750243012355','Avena Quaker 380g',           (SELECT id FROM cat WHERE nombre='Abarrotes'),'bolsa',  4.00,  5.50, 30, 10, true, true),
('7750243012356','Café Altomayo 190g',          (SELECT id FROM cat WHERE nombre='Abarrotes'),'frasco',12.00, 15.90, 25,  8, true, true),
-- BEBIDAS
('7751111000001','Inca Kola 1.5L',              (SELECT id FROM cat WHERE nombre='Bebidas'),'botella', 4.80,  6.50, 60, 20, true, true),
('7751111000002','Coca Cola 1.5L',              (SELECT id FROM cat WHERE nombre='Bebidas'),'botella', 4.90,  6.80, 60, 20, true, true),
('7751111000003','Sprite 1.5L',                 (SELECT id FROM cat WHERE nombre='Bebidas'),'botella', 4.50,  6.20, 40, 15, true, true),
('7751111000004','Agua San Luis 625ml',         (SELECT id FROM cat WHERE nombre='Bebidas'),'botella', 1.00,  2.00, 80, 30, true, true),
('7751111000005','Agua Cielo 625ml',            (SELECT id FROM cat WHERE nombre='Bebidas'),'botella', 0.90,  1.80, 90, 30, true, true),
('7751111000006','Cerveza Cristal 650ml',       (SELECT id FROM cat WHERE nombre='Bebidas'),'botella', 5.50,  7.50, 50, 20, true, true),
('7751111000007','Cerveza Pilsen 650ml',        (SELECT id FROM cat WHERE nombre='Bebidas'),'botella', 5.50,  7.50, 50, 20, true, true),
('7751111000008','Cerveza Cusqueña 330ml',      (SELECT id FROM cat WHERE nombre='Bebidas'),'botella', 4.00,  5.50, 40, 15, true, true),
('7751111000009','Frugos Naranja 1L',           (SELECT id FROM cat WHERE nombre='Bebidas'),'botella', 3.50,  4.90, 30, 10, true, true),
('7751111000010','Gatorade Tropical 500ml',     (SELECT id FROM cat WHERE nombre='Bebidas'),'botella', 3.20,  4.50, 35, 10, true, true),
-- LÁCTEOS
('7752222000001','Leche Gloria Caja 1L',        (SELECT id FROM cat WHERE nombre='Lácteos'),'caja',    4.20,  5.80, 50, 20, true, true),
('7752222000002','Leche Laive Sin Lactosa 1L',  (SELECT id FROM cat WHERE nombre='Lácteos'),'caja',    5.50,  7.20, 30, 10, true, true),
('7752222000003','Yogurt Gloria Fresa 1L',      (SELECT id FROM cat WHERE nombre='Lácteos'),'botella', 6.50,  8.90, 25, 10, true, true),
('7752222000004','Yogurt Laive Vainilla 1L',    (SELECT id FROM cat WHERE nombre='Lácteos'),'botella', 6.50,  8.90, 25, 10, true, true),
('7752222000005','Queso Fresco 500g',           (SELECT id FROM cat WHERE nombre='Lácteos'),'kg',     12.00, 16.90, 15,  5, true, true),
('7752222000006','Mantequilla Gloria 200g',     (SELECT id FROM cat WHERE nombre='Lácteos'),'pote',    5.50,  7.50, 20,  8, true, true),
('7752222000007','Huevos Pardo x12',            (SELECT id FROM cat WHERE nombre='Lácteos'),'docena',  9.00, 12.50, 30, 10, true, true),
-- PANADERÍA
('PAN000001','Pan Francés (unidad)',            (SELECT id FROM cat WHERE nombre='Panadería'),'unidad', 0.15,  0.30,200, 50, true, true),
('PAN000002','Pan Yema (unidad)',               (SELECT id FROM cat WHERE nombre='Panadería'),'unidad', 0.25,  0.50,150, 40, true, true),
('PAN000003','Pan Integral (unidad)',           (SELECT id FROM cat WHERE nombre='Panadería'),'unidad', 0.30,  0.60,100, 30, true, true),
('PAN000004','Bizcocho Chancay',                (SELECT id FROM cat WHERE nombre='Panadería'),'unidad', 0.40,  0.80, 60, 20, true, true),
('PAN000005','Tostadas Bimbo 450g',             (SELECT id FROM cat WHERE nombre='Panadería'),'bolsa',  4.50,  6.50, 20,  8, true, true),
-- LIMPIEZA
('7753333000001','Detergente Ariel 800g',       (SELECT id FROM cat WHERE nombre='Limpieza'),'bolsa',   9.00, 12.90, 30, 10, true, true),
('7753333000002','Detergente Bolívar 800g',     (SELECT id FROM cat WHERE nombre='Limpieza'),'bolsa',   8.00, 11.50, 30, 10, true, true),
('7753333000003','Lavavajilla Sapolio 360g',    (SELECT id FROM cat WHERE nombre='Limpieza'),'pote',    4.50,  6.50, 40, 15, true, true),
('7753333000004','Lejía Clorox 1L',             (SELECT id FROM cat WHERE nombre='Limpieza'),'botella', 3.50,  4.90, 35, 10, true, true),
('7753333000005','Papel Higiénico Suave x4',    (SELECT id FROM cat WHERE nombre='Limpieza'),'paquete', 5.50,  7.50, 50, 20, true, true),
('7753333000006','Papel Higiénico Elite x12',   (SELECT id FROM cat WHERE nombre='Limpieza'),'paquete',14.00, 19.90, 25, 10, true, true),
('7753333000007','Jabón Bolívar 250g',          (SELECT id FROM cat WHERE nombre='Limpieza'),'unidad',  2.20,  3.20, 60, 20, true, true),
('7753333000008','Pasta Dental Colgate 90g',    (SELECT id FROM cat WHERE nombre='Limpieza'),'unidad',  4.50,  6.50, 30, 10, true, true),
('7753333000009','Shampoo Head&Shoulders 375ml',(SELECT id FROM cat WHERE nombre='Limpieza'),'botella',12.00, 16.90, 20,  8, true, true),
-- SNACKS
('7754444000001','Papitas Lays Clásicas 145g',  (SELECT id FROM cat WHERE nombre='Snacks'),'bolsa',    4.20,  5.90, 50, 20, true, true),
('7754444000002','Doritos Queso 145g',          (SELECT id FROM cat WHERE nombre='Snacks'),'bolsa',    4.20,  5.90, 40, 15, true, true),
('7754444000003','Chizitos 100g',               (SELECT id FROM cat WHERE nombre='Snacks'),'bolsa',    2.50,  3.50, 50, 20, true, true),
('7754444000004','Cua Cua Chocolate',           (SELECT id FROM cat WHERE nombre='Snacks'),'unidad',   0.60,  1.00, 80, 30, true, true),
('7754444000005','Sublime Clásico',             (SELECT id FROM cat WHERE nombre='Snacks'),'unidad',   1.20,  1.80, 60, 20, true, true),
('7754444000006','Galleta Soda Field x6',       (SELECT id FROM cat WHERE nombre='Snacks'),'paquete',  2.50,  3.50, 40, 15, true, true),
('7754444000007','Galleta Oreo 117g',           (SELECT id FROM cat WHERE nombre='Snacks'),'paquete',  2.20,  3.20, 50, 20, true, true),
('7754444000008','Chocman Chocolate',           (SELECT id FROM cat WHERE nombre='Snacks'),'unidad',   1.00,  1.50, 60, 20, true, true),
-- CARNES
('CAR000001','Pollo Entero (kg)',               (SELECT id FROM cat WHERE nombre='Carnes'),'kg',      10.50, 13.90, 30,  8, true, true),
('CAR000002','Pechuga de Pollo (kg)',           (SELECT id FROM cat WHERE nombre='Carnes'),'kg',      14.00, 18.90, 20,  6, true, true),
('CAR000003','Carne Molida Res (kg)',           (SELECT id FROM cat WHERE nombre='Carnes'),'kg',      20.00, 26.90, 15,  5, true, true),
('CAR000004','Bistec de Res (kg)',              (SELECT id FROM cat WHERE nombre='Carnes'),'kg',      24.00, 32.90, 12,  4, true, true),
('CAR000005','Chuleta de Cerdo (kg)',           (SELECT id FROM cat WHERE nombre='Carnes'),'kg',      18.00, 24.50, 15,  5, true, true),
('CAR000006','Hot Dog Otto Kunz 1kg',           (SELECT id FROM cat WHERE nombre='Carnes'),'paquete', 12.00, 16.90, 25,  8, true, true),
('CAR000007','Jamonada San Fernando 500g',      (SELECT id FROM cat WHERE nombre='Carnes'),'paquete',  9.00, 12.90, 20,  8, true, true),
-- FRUTAS
('FRU000001','Plátano Seda (kg)',               (SELECT id FROM cat WHERE nombre='Frutas'),'kg',       2.00,  3.50, 40, 10, true, true),
('FRU000002','Manzana Israel (kg)',             (SELECT id FROM cat WHERE nombre='Frutas'),'kg',       4.50,  6.90, 30, 10, true, true),
('FRU000003','Naranja Valencia (kg)',           (SELECT id FROM cat WHERE nombre='Frutas'),'kg',       2.50,  3.90, 40, 10, true, true),
('FRU000004','Palta Fuerte (kg)',               (SELECT id FROM cat WHERE nombre='Frutas'),'kg',       5.00,  7.90, 25,  8, true, true),
('FRU000005','Limón Sutil (kg)',                (SELECT id FROM cat WHERE nombre='Frutas'),'kg',       3.00,  4.90, 30, 10, true, true),
('FRU000006','Tomate Italiano (kg)',            (SELECT id FROM cat WHERE nombre='Frutas'),'kg',       2.50,  3.90, 35, 10, true, true),
('FRU000007','Papa Amarilla (kg)',              (SELECT id FROM cat WHERE nombre='Frutas'),'kg',       2.20,  3.50, 50, 15, true, true),
('FRU000008','Cebolla Roja (kg)',               (SELECT id FROM cat WHERE nombre='Frutas'),'kg',       2.00,  3.20, 50, 15, true, true)
ON CONFLICT (codigo_barras) DO NOTHING;

-- ---------------------------------------------------------------------
-- 2) PROVEEDORES (8 empresas reales del rubro)
-- ---------------------------------------------------------------------
INSERT INTO public.proveedores
  (razon_social, nombre_comercial, ruc, contacto, telefono, correo, direccion, dias_credito, activo)
VALUES
  ('Distribuidora Andina S.A.C.', 'Andina',      '20512345678', 'Carlos Ramírez',  '987654321', 'ventas@andina.pe',           'Av. Argentina 1234, Lima',      15, true),
  ('Alicorp S.A.A.',              'Alicorp',     '20100055237', 'María López',     '987111222', 'pedidos@alicorp.com',        'Av. Argentina 4793, Callao',    30, true),
  ('Gloria S.A.',                 'Gloria',      '20100190797', 'Jorge Fernández', '987333444', 'ventas@gloria.com.pe',       'Av. República de Panamá 2461',  30, true),
  ('Backus y Johnston',           'Backus',      '20100113610', 'Luis Torres',     '987555666', 'pedidos@backus.pe',          'Av. Nicolás Ayllón 3986, Ate',  21, true),
  ('San Fernando S.A.',           'San Fernando','20100154308', 'Ana Vargas',      '987777888', 'ventas@sanfernando.com.pe',  'Av. República de Panamá 4295',  15, true),
  ('Molitalia S.A.',              'Molitalia',   '20301837896', 'Pedro Salas',     '987999000', 'comercial@molitalia.com',    'Av. Venezuela 2850, Lima',      30, true),
  ('Coca-Cola Servicios Perú',    'Coca-Cola',   '20100078792', 'Rosa Medina',     '988112233', 'ventas@coca-cola.pe',        'Av. La Molina 190, La Molina',   7, true),
  ('Nestlé Perú S.A.',            'Nestlé',      '20263322496', 'Diego Palma',     '988445566', 'pedidos@nestle.pe',          'Av. Los Castillos 4776, Ate',   30, true)
ON CONFLICT (ruc) DO NOTHING;

-- ---------------------------------------------------------------------
-- 3) CLIENTES (8 DNI + 2 RUC)
-- ---------------------------------------------------------------------
INSERT INTO public.clientes
  (tipo_documento, numero_documento, razon_social, nombres, apellidos, telefono, correo, direccion, activo)
VALUES
  ('DNI', '45678912', NULL, 'Juan Carlos',   'Pérez García',    '987123456', 'juan.perez@gmail.com',      'Jr. Los Olivos 245, SJL',       true),
  ('DNI', '46789123', NULL, 'María Elena',   'Quispe Huamán',   '987234567', 'maria.quispe@gmail.com',    'Av. Universitaria 1500, SMP',   true),
  ('DNI', '47891234', NULL, 'Luis Alberto',  'Rodríguez Silva', '987345678', 'luis.rodriguez@hotmail.com','Calle Las Flores 89, Comas',    true),
  ('DNI', '48912345', NULL, 'Ana Sofía',     'Mendoza Torres',  '987456789', 'ana.mendoza@gmail.com',     'Av. Los Álamos 456, Los Olivos',true),
  ('DNI', '49123456', NULL, 'Carlos Eduardo','Vargas Ríos',     '987567890', 'carlos.vargas@yahoo.com',   'Jr. Amazonas 123, Rímac',       true),
  ('DNI', '41234567', NULL, 'Rosa María',    'Chávez Flores',   '987678901', 'rosa.chavez@gmail.com',     'Av. Perú 890, SMP',             true),
  ('DNI', '42345678', NULL, 'Pedro Miguel',  'Sánchez Díaz',    '987789012', 'pedro.sanchez@gmail.com',   'Calle Real 234, Independencia', true),
  ('DNI', '43456789', NULL, 'Lucía Isabel',  'Ramos Castro',    '987890123', 'lucia.ramos@hotmail.com',   'Av. Túpac Amaru 678, Comas',    true),
  ('RUC', '10456789123', 'Bodega Doña Rosa E.I.R.L.',        NULL, NULL, '987901234', 'bodegaros@gmail.com',    'Av. Los Próceres 1234, SJL', true),
  ('RUC', '20567891234', 'Restaurante El Buen Sabor S.A.C.', NULL, NULL, '988012345', 'contacto@buensabor.pe',  'Av. La Marina 2345, SMP',    true)
ON CONFLICT (numero_documento) DO NOTHING;

-- ---------------------------------------------------------------------
-- 4) LOTES DE EJEMPLO (solo si existe la tabla public.lotes)
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='lotes') THEN
    INSERT INTO public.lotes
      (producto_id, numero_lote, fecha_produccion, fecha_vencimiento,
       cantidad_inicial, cantidad_actual, costo_unitario, ubicacion, bloqueado)
    SELECT p.id, v.numero_lote, v.fecha_produccion::date, v.fecha_vencimiento::date,
           v.cantidad_inicial, v.cantidad_actual, v.costo_unitario, v.ubicacion, v.bloqueado
    FROM (VALUES
      ('7750243012348','L-2025-AC001', CURRENT_DATE - 60,  CURRENT_DATE + 180, 24, 18, 8.50, 'Estante A-1', false),
      ('7750243012348','L-2025-AC002', CURRENT_DATE - 20,  CURRENT_DATE + 240, 24, 24, 8.60, 'Estante A-1', false),
      ('7750243012345','L-2025-AR001', CURRENT_DATE - 90,  CURRENT_DATE + 365, 50, 30,22.00, 'Estante A-2', false),
      ('7750243012347','L-2025-AZ001', CURRENT_DATE - 120, CURRENT_DATE + 300, 40, 22, 3.50, 'Estante A-3', false),
      ('7750243012350','L-2025-FI001', CURRENT_DATE - 45,  CURRENT_DATE + 540, 60, 45, 3.20, 'Estante A-4', false),
      ('7751111000004','L-2025-AG001', CURRENT_DATE - 30,  CURRENT_DATE + 270, 72, 68, 1.00, 'Estante B-1', false),
      ('7751111000002','L-2025-CC001', CURRENT_DATE - 40,  CURRENT_DATE + 150, 60, 60, 4.90, 'Estante B-2', false),
      ('7751111000002','L-2025-CC002', CURRENT_DATE - 5,   CURRENT_DATE + 5,   24, 12, 4.95, 'Estante B-2', false),
      ('7754444000003','L-2025-CZ001', CURRENT_DATE - 15,  CURRENT_DATE + 25,  60, 55, 2.50, 'Estante C-1', false),
      ('7754444000002','L-2025-DO001', CURRENT_DATE - 25,  CURRENT_DATE + 90,  50, 45, 4.20, 'Estante C-2', false),
      ('7754444000005','L-2024-SU001', CURRENT_DATE - 300, CURRENT_DATE - 10,  80, 60, 1.20, 'Estante C-3', false),
      ('7754444000005','L-2025-SU002', CURRENT_DATE - 30,  CURRENT_DATE + 180, 60, 60, 1.25, 'Estante C-3', false),
      ('7753333000001','L-2025-DE001', CURRENT_DATE - 80,  CURRENT_DATE + 720, 30, 20, 9.00, 'Estante D-1', false)
    ) AS v(codigo_barras, numero_lote, fecha_produccion, fecha_vencimiento,
           cantidad_inicial, cantidad_actual, costo_unitario, ubicacion, bloqueado)
    JOIN public.productos p ON p.codigo_barras = v.codigo_barras
    ON CONFLICT (producto_id, numero_lote) DO NOTHING;
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 5) COMPRAS DEMO (5 compras con 2–4 líneas cada una)
-- ---------------------------------------------------------------------
DO $$
DECLARE
  v_user uuid; v_prov uuid; v_compra uuid; v_prod record;
  v_subtotal numeric; v_igv numeric; v_total numeric;
  v_cant numeric; v_precio numeric; v_stl numeric; v_ttl numeric;
  v_fecha date; v_num text; i int;
BEGIN
  SELECT id INTO v_user FROM auth.users ORDER BY created_at LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM public.productos LIMIT 1) THEN
    RAISE NOTICE 'No hay productos: se omiten compras.'; RETURN;
  END IF;

  FOR i IN 1..5 LOOP
    SELECT id INTO v_prov FROM public.proveedores WHERE activo ORDER BY random() LIMIT 1;
    v_fecha := CURRENT_DATE - (i * 3);
    v_num := 'F001-' || LPAD((1000 + i)::text, 6, '0');
    v_subtotal := 0; v_igv := 0; v_total := 0;

    INSERT INTO public.compras
      (proveedor_id, tipo_comprobante, numero_documento, fecha_emision, metodo_pago,
       subtotal, igv, total, estado, usuario_id)
    VALUES (v_prov, 'FACTURA', v_num, v_fecha, 'CREDITO', 0, 0, 0, 'RECIBIDA', v_user)
    RETURNING id INTO v_compra;

    FOR v_prod IN
      SELECT id, COALESCE(precio_compra, 1) AS pc
      FROM public.productos ORDER BY random()
      LIMIT (2 + floor(random()*3))::int
    LOOP
      v_cant := (5 + floor(random()*20))::numeric;
      v_precio := round(v_prod.pc::numeric, 2);
      v_ttl := round(v_cant * v_precio, 2);
      v_stl := round(v_ttl / 1.18, 2);
      INSERT INTO public.detalle_compras
        (compra_id, producto_id, cantidad, precio_unitario, subtotal, igv, total)
      VALUES (v_compra, v_prod.id, v_cant, v_precio, v_stl, v_ttl - v_stl, v_ttl);
      v_subtotal := v_subtotal + v_stl;
      v_igv := v_igv + (v_ttl - v_stl);
      v_total := v_total + v_ttl;
    END LOOP;

    UPDATE public.compras
       SET subtotal = round(v_subtotal,2), igv = round(v_igv,2), total = round(v_total,2)
     WHERE id = v_compra;
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

-- =====================================================================
-- LISTO. Verifica:
--   SELECT COUNT(*) FROM public.productos;    -- ~60
--   SELECT COUNT(*) FROM public.proveedores;  -- 8
--   SELECT COUNT(*) FROM public.clientes;     -- 10
--   SELECT COUNT(*) FROM public.compras;      -- 5
-- =====================================================================