-- Create pricebook table for 317plumber
-- This table stores pricing for services and materials

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create pricebook_categories table for organizing items
CREATE TABLE IF NOT EXISTS pricebook_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  parent_id uuid REFERENCES pricebook_categories(id), -- For nested categories
  description text,
  image_url text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create the main pricebook table
CREATE TABLE IF NOT EXISTS pricebook (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id uuid REFERENCES pricebook_categories(id),
  sku text, -- Part number or service code
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('material', 'service', 'equipment')),
  unit_of_measure text DEFAULT 'each', -- ea, ft, hr, etc.
  cost_price bigint, -- Cost in cents
  unit_price bigint NOT NULL, -- Selling price in cents
  member_price bigint, -- Special member pricing
  add_on_price bigint, -- Price when added as add-on
  add_on_member_price bigint, -- Member add-on price
  labor_hours decimal(8,2), -- For services
  is_inventory_item boolean DEFAULT false,
  taxable boolean DEFAULT true,
  image_url text,
  youtube_url text,
  active boolean DEFAULT true,
  supplier_name text, -- Primary supplier
  supplier_sku text, -- Supplier part number
  supplier_cost bigint, -- Cost from supplier
  external_id text, -- ID from external system
  external_source text, -- Source system name
  notes jsonb, -- Additional notes as JSON
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create pricebook_variants for items with variations (size, color, etc.)
CREATE TABLE IF NOT EXISTS pricebook_variants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pricebook_item_id uuid NOT NULL REFERENCES pricebook(id) ON DELETE CASCADE,
  variant_name text NOT NULL, -- e.g., "1/2 inch", "Red", "Large"
  variant_value text NOT NULL, -- The actual variant value
  sku text,
  unit_price bigint,
  cost_price bigint,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create junction tables for many-to-many relationships
CREATE TABLE IF NOT EXISTS pricebook_service_materials (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id uuid NOT NULL REFERENCES pricebook(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES pricebook(id) ON DELETE CASCADE,
  quantity decimal(10,2) DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE(service_id, material_id)
);

CREATE TABLE IF NOT EXISTS pricebook_service_equipment (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id uuid NOT NULL REFERENCES pricebook(id) ON DELETE CASCADE,
  equipment_id uuid NOT NULL REFERENCES pricebook(id) ON DELETE CASCADE,
  required boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(service_id, equipment_id)
);

-- Enable RLS
ALTER TABLE pricebook_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricebook ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricebook_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricebook_service_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricebook_service_equipment ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their account's pricebook categories" ON pricebook_categories
  FOR SELECT USING (auth.uid() IS NOT NULL AND account_id IN (
    SELECT account_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert pricebook categories" ON pricebook_categories
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND account_id IN (
    SELECT account_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update their account's pricebook categories" ON pricebook_categories
  FOR UPDATE USING (auth.uid() IS NOT NULL AND account_id IN (
    SELECT account_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete their account's pricebook categories" ON pricebook_categories
  FOR DELETE USING (auth.uid() IS NOT NULL AND account_id IN (
    SELECT account_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can view their account's pricebook" ON pricebook
  FOR SELECT USING (auth.uid() IS NOT NULL AND account_id IN (
    SELECT account_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert pricebook items" ON pricebook
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND account_id IN (
    SELECT account_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update their account's pricebook" ON pricebook
  FOR UPDATE USING (auth.uid() IS NOT NULL AND account_id IN (
    SELECT account_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete their account's pricebook" ON pricebook
  FOR DELETE USING (auth.uid() IS NOT NULL AND account_id IN (
    SELECT account_id FROM users WHERE id = auth.uid()
  ));

-- Similar policies for junction tables
CREATE POLICY "Users can view service-material links" ON pricebook_service_materials
  FOR SELECT USING (auth.uid() IS NOT NULL AND service_id IN (
    SELECT id FROM pricebook WHERE account_id IN (
      SELECT account_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can manage service-material links" ON pricebook_service_materials
  FOR ALL USING (auth.uid() IS NOT NULL AND service_id IN (
    SELECT id FROM pricebook WHERE account_id IN (
      SELECT account_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can view service-equipment links" ON pricebook_service_equipment
  FOR SELECT USING (auth.uid() IS NOT NULL AND service_id IN (
    SELECT id FROM pricebook WHERE account_id IN (
      SELECT account_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can manage service-equipment links" ON pricebook_service_equipment
  FOR ALL USING (auth.uid() IS NOT NULL AND service_id IN (
    SELECT id FROM pricebook WHERE account_id IN (
      SELECT account_id FROM users WHERE id = auth.uid()
    )
  ));

-- Create indexes for performance
CREATE INDEX idx_pricebook_categories_account ON pricebook_categories(account_id);
CREATE INDEX idx_pricebook_categories_parent ON pricebook_categories(parent_id);
CREATE INDEX idx_pricebook_categories_active ON pricebook_categories(active);

CREATE INDEX idx_pricebook_account ON pricebook(account_id);
CREATE INDEX idx_pricebook_category ON pricebook(category_id);
CREATE INDEX idx_pricebook_type ON pricebook(type);
CREATE INDEX idx_pricebook_sku ON pricebook(sku);
CREATE INDEX idx_pricebook_active ON pricebook(active);
CREATE INDEX idx_pricebook_name ON pricebook USING gin(to_tsvector('english', name));
CREATE INDEX idx_pricebook_external ON pricebook(external_id, external_source);

CREATE INDEX idx_pricebook_variants_item ON pricebook_variants(pricebook_item_id);
CREATE INDEX idx_pricebook_variants_active ON pricebook_variants(active);

CREATE INDEX idx_pricebook_service_materials_service ON pricebook_service_materials(service_id);
CREATE INDEX idx_pricebook_service_materials_material ON pricebook_service_materials(material_id);

CREATE INDEX idx_pricebook_service_equipment_service ON pricebook_service_equipment(service_id);
CREATE INDEX idx_pricebook_service_equipment_equipment ON pricebook_service_equipment(equipment_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_pricebook_categories_updated_at BEFORE UPDATE
  ON pricebook_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricebook_updated_at BEFORE UPDATE
  ON pricebook FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE pricebook_categories IS 'Categories for organizing pricebook items';
COMMENT ON TABLE pricebook IS 'Main pricebook containing materials, services, and equipment pricing';
COMMENT ON TABLE pricebook_variants IS 'Variations of pricebook items (size, color, etc.)';
COMMENT ON TABLE pricebook_service_materials IS 'Links services to required materials';
COMMENT ON TABLE pricebook_service_equipment IS 'Links services to required equipment';