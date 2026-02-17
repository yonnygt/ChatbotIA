-- ============================================
-- ButcherAI — Database Initialization Script
-- PostgreSQL DDL + Seed Data
-- ============================================

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  description   TEXT,
  category      VARCHAR(100) NOT NULL,
  price         NUMERIC(10,2) NOT NULL,
  unit          VARCHAR(50) DEFAULT 'kg',
  image_url     TEXT,
  sku           VARCHAR(50),
  location      VARCHAR(100),
  in_stock      BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Orders table (con jsonb para items inline)
CREATE TABLE IF NOT EXISTS orders (
  id                SERIAL PRIMARY KEY,
  user_id           VARCHAR(255),
  order_number      VARCHAR(20) NOT NULL UNIQUE,
  priority          VARCHAR(10) DEFAULT 'normal',
  status            VARCHAR(30) NOT NULL DEFAULT 'pending',
  items             JSONB,
  notes             TEXT,
  estimated_minutes INTEGER,
  total_amount      NUMERIC(10,2),
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

-- Order items table (relación detallada)
CREATE TABLE IF NOT EXISTS order_items (
  id          SERIAL PRIMARY KEY,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  INTEGER NOT NULL REFERENCES products(id),
  quantity    NUMERIC(10,3) NOT NULL,
  unit_price  NUMERIC(10,2) NOT NULL,
  notes       TEXT
);

-- QR Sessions table (validación de entregas)
CREATE TABLE IF NOT EXISTS qr_sessions (
  id          SERIAL PRIMARY KEY,
  token       VARCHAR(255) NOT NULL UNIQUE,
  order_id    INTEGER REFERENCES orders(id),
  status      VARCHAR(30) NOT NULL DEFAULT 'pending',
  expires_at  TIMESTAMP NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Seed Data — Demo Products
-- ============================================

INSERT INTO products (name, description, category, price, unit, sku, location, in_stock) VALUES
  ('Solomillo de Ternera',    'Corte premium, ideal para filetes',        'carnes',      48.90, 'kg',  '10001', 'Mostrador',    TRUE),
  ('Carne Molida Magra',      'Ternera magra para preparados',            'carnes',      12.50, 'lb',  '49201', 'Pasillo 4',    TRUE),
  ('Pechuga de Pollo',        'Ecológico, Corral',                        'carnes',      14.90, 'kg',  '20010', 'Mostrador',    TRUE),
  ('Chuletón de Buey',        'Madurado 30 días, hueso incluido',         'carnes',      62.00, 'kg',  '10050', 'Vitrina 1',    TRUE),
  ('Costillas de Cerdo',      'Rack completo, ideales para BBQ',          'carnes',      18.50, 'kg',  '30010', 'Mostrador',    TRUE),
  ('Jamón Serrano',           'Gran Reserva 24 meses',                    'charcutería', 45.00, 'kg',  '40001', 'Vitrina 2',    TRUE),
  ('Pechuga de Pavo Rebanada','Pechuga de pavo baja en grasa',            'charcutería', 22.00, 'kg',  '88210', 'Mostrador',    TRUE),
  ('Prosciutto di Parma',     'Importado de Italia, curación artesanal',  'charcutería', 68.00, 'kg',  '11029', 'Vitrina 2',    FALSE),
  ('Salami Génova',           'Embutido italiano con especias',           'charcutería', 28.50, 'kg',  '33910', 'Vitrina 2',    TRUE),
  ('Queso Gouda',             'Holandés madurado 6 meses',                'lácteos',     24.00, 'kg',  '60001', 'Vitrina 3',    TRUE),
  ('Queso Provolone',         'Italiano ahumado',                         'lácteos',     32.00, 'kg',  '60015', 'Vitrina 3',    TRUE),
  ('Pollo Rostizado - Limón', 'Pollo entero rostizado con limón y hierbas','preparados', 15.90, 'ud',  '55001', 'Barra Caliente',TRUE),
  ('Baguette Artesanal',      'Pan fresco del día',                       'panadería',    3.50, 'ud',  '70001', 'Panadería',    TRUE);

-- Sample orders
INSERT INTO orders (order_number, status, items, notes, estimated_minutes, total_amount) VALUES
  ('#1234', 'pending',   '[{"name":"Solomillo","qty":"500g","price":24.50}]', 'Cortar en 2 filetes gruesos, quitar el exceso de grasa.', 10, 24.50),
  ('#4922', 'pending',   '[{"name":"Pechuga de Pollo","qty":"500g","price":7.45}]', 'Bolsas separadas', 8, 7.45),
  ('#4918', 'preparing', '[{"name":"Jamón Serrano","qty":"200g","price":9.00}]', 'Cortes finos', 5, 9.00),
  ('#4915', 'pending',   '[{"name":"Carne Picada","qty":"1kg","price":12.50}]', NULL, 12, 12.50),
  ('#1209', 'preparing', '[{"name":"Jamón Serrano","qty":"200g"},{"name":"Provolone","qty":"100g"}]', NULL, 5, 18.20),
  ('#1185', 'ready',     '[{"name":"Chuletón","qty":"1kg","price":62.00}]', NULL, 0, 62.00);
