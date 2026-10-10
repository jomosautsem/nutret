-- ============================================================================
-- 011_seed_data.sql: Demonstration & Baseline Clinical Seed Data
-- ============================================================================

-- Insert Equivalent Groups (SMAE)
INSERT INTO food_equivalent_groups (name, code, color_hex, avg_energy_kcal, avg_protein_g, avg_carbs_g, avg_fat_g, description) VALUES
('Verduras', 'VERDURAS', '#10B981', 25, 2, 4, 0, 'Aporte alto en micronutrientes y fibra dietética.'),
('Frutas', 'FRUTAS', '#F59E0B', 60, 0, 15, 0, 'Aporte de carbohidratos simples, fructosa y vitaminas.'),
('Cereales y Tubérculos sin grasa', 'CEREALES_SG', '#EAB308', 70, 2, 15, 0, 'Avena, arroz integral, tortilla de maíz, pasta integral.'),
('Cereales con grasa', 'CEREALES_CG', '#D97706', 115, 2, 15, 5, 'Galletas, pan dulce, tamal, granola con grasa.'),
('Leguminosas', 'LEGUMINOSAS', '#84CC16', 120, 8, 20, 1, 'Frijoles, lentejas, garbanzos, habas cocidas.'),
('Alimentos de Origen Animal Muy Bajo Aporte', 'AOA_MBA', '#EF4444', 40, 7, 0, 1, 'Claras de huevo, pechuga de pavo, atún en agua.'),
('Alimentos de Origen Animal Bajo Aporte', 'AOA_BA', '#F87171', 55, 7, 0, 3, 'Pechuga de pollo sin piel, filete de pescado blanco, queso panela.'),
('Alimentos de Origen Animal Moderado Aporte', 'AOA_MA', '#DC2626', 75, 7, 0, 5, 'Huevo entero, carne de res magra, queso Oaxaca.'),
('Alimentos de Origen Animal Alto Aporte', 'AOA_AA', '#B91C1C', 100, 7, 0, 8, 'Queso manchego, carne de cerdo con grasa, salchicha.'),
('Leche descremada', 'LECHE_DESC', '#3B82F6', 95, 9, 12, 2, 'Leche descremada, yogur griego 0% grasa.'),
('Leche entera', 'LECHE_ENT', '#1D4ED8', 150, 9, 12, 8, 'Leche entera pasteurizada, yogur entero.'),
('Aceites y Grasas sin proteína', 'GRASAS_SP', '#8B5CF6', 45, 0, 0, 5, 'Aceite de oliva extra virgen, aguacate Hass, aceite de aguacate.'),
('Aceites y Grasas con proteína', 'GRASAS_CP', '#6D28D9', 70, 3, 3, 5, 'Nueces, almendras, cacahuates, semillas de chía o linaza.'),
('Azúcares sin grasa', 'AZUCARES_SG', '#EC4899', 40, 0, 10, 0, 'Miel de abeja, mermelada baja en azúcar, azúcar mascabado.');
