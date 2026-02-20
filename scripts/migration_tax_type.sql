-- Migration: Add tax_type column to products
-- Values: 'gravado' (IVA 16%), 'exento' (no IVA)
ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_type varchar(20) DEFAULT 'gravado';
