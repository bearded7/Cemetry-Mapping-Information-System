-- Seed data for development

-- Insert test admin user (password: admin123)
INSERT INTO users (email, password_hash, full_name, role) 
VALUES (
  'admin@cemetery.com',
  '$2a$10$QVGcG8XILKZkDn7Qjg9R.ecX1Fy9NEbM/gF5HwZq1jkp5S0d6f8qK',
  'System Administrator',
  'admin'
) ON CONFLICT (email) DO NOTHING;

-- Insert sample cemeteries
INSERT INTO cemeteries (name, description, address, city, state, country, latitude, longitude, established_year) 
VALUES 
  ('Greenwood Memorial Park', 'Historic cemetery established in 1892', '123 Cemetery Road', 'Springfield', 'IL', 'USA', 39.7817, -89.6501, 1892),
  ('Oakwood Cemetery', 'Peaceful resting place with century-old oaks', '456 Oak Avenue', 'Austin', 'TX', 'USA', 30.2672, -97.7431, 1860),
  ('Sunset Hills Memorial', 'Modern cemetery with scenic views', '789 Sunset Drive', 'Los Angeles', 'CA', 'USA', 34.0522, -118.2437, 1950)
ON CONFLICT (id) DO NOTHING;

-- Insert sample graves
INSERT INTO graves (cemetery_id, section, block, plot_number, deceased_name, birth_date, death_date, epitaph) 
SELECT 
  c.id,
  'A',
  '1',
  '101',
  'John Doe',
  '1945-01-15',
  '2020-12-25',
  'Beloved Husband and Father'
FROM cemeteries c WHERE c.name = 'Greenwood Memorial Park'
LIMIT 1;

INSERT INTO graves (cemetery_id, section, block, plot_number, deceased_name, birth_date, death_date, epitaph) 
SELECT 
  c.id,
  'B',
  '2',
  '205',
  'Jane Smith',
  '1950-06-30',
  '2019-03-15',
  'Forever in our hearts'
FROM cemeteries c WHERE c.name = 'Oakwood Cemetery'
LIMIT 1;