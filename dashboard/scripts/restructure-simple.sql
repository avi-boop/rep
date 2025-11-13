-- Restructure repair types with subcategories
-- Run with: psql ...

-- Step 1: Update existing main categories
UPDATE repair_types SET "displayOrder" = 1, category = 'Display', "isMainCategory" = true WHERE name = 'Front Screen';
UPDATE repair_types SET "displayOrder" = 2, category = 'Body', "isMainCategory" = true WHERE name = 'Back Panel';
UPDATE repair_types SET "displayOrder" = 3, category = 'Power', "isMainCategory" = true WHERE name = 'Battery';

-- Step 2: Create "Other" main category if it doesn't exist
INSERT INTO repair_types (name, category, "displayOrder", "isMainCategory", "isActive", "createdAt", "updatedAt")
VALUES ('Other', 'Miscellaneous', 4, true, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET
    "displayOrder" = 4,
    category = 'Miscellaneous',
    "isMainCategory" = true;

-- Step 3: Migrate existing specialized repair types to "Other"
DO $$
DECLARE
    other_id INTEGER;
    camera_rear_id INTEGER;
    charging_port_id INTEGER;
BEGIN
    -- Get the "Other" category ID
    SELECT id INTO other_id FROM repair_types WHERE name = 'Other';

    -- Get Camera - Rear ID if exists
    SELECT id INTO camera_rear_id FROM repair_types WHERE name = 'Camera - Rear';
    IF camera_rear_id IS NOT NULL THEN
        -- Migrate pricing
        UPDATE pricing SET "repairTypeId" = other_id WHERE "repairTypeId" = camera_rear_id;
        -- Delete the repair type
        DELETE FROM repair_types WHERE id = camera_rear_id;
    END IF;

    -- Get Charging Port ID if exists
    SELECT id INTO charging_port_id FROM repair_types WHERE name = 'Charging Port';
    IF charging_port_id IS NOT NULL THEN
        -- Migrate pricing
        UPDATE pricing SET "repairTypeId" = other_id WHERE "repairTypeId" = charging_port_id;
        -- Delete the repair type
        DELETE FROM repair_types WHERE id = charging_port_id;
    END IF;
END $$;

-- Step 4: Create subcategory repair types (under "Other")
INSERT INTO repair_types (name, category, subcategory, "displayOrder", "isMainCategory", "isActive", "createdAt", "updatedAt")
VALUES
    ('Camera - Rear', 'Camera', 'Camera', 10, false, true, NOW(), NOW()),
    ('Camera - Front', 'Camera', 'Camera', 11, false, true, NOW(), NOW()),
    ('Camera Lens - Rear', 'Camera', 'Camera', 12, false, true, NOW(), NOW()),
    ('Camera Lens - Front', 'Camera', 'Camera', 13, false, true, NOW(), NOW()),
    ('Top Speaker', 'Audio', 'Audio', 14, false, true, NOW(), NOW()),
    ('Bottom Speaker', 'Audio', 'Audio', 15, false, true, NOW(), NOW()),
    ('Earpiece', 'Audio', 'Audio', 16, false, true, NOW(), NOW()),
    ('Microphone', 'Audio', 'Audio', 17, false, true, NOW(), NOW()),
    ('Charging Port', 'Port', 'Port', 18, false, true, NOW(), NOW()),
    ('Headphone Jack', 'Port', 'Port', 19, false, true, NOW(), NOW()),
    ('SIM Tray', 'Port', 'Port', 20, false, true, NOW(), NOW()),
    ('Power Button', 'Button', 'Button', 21, false, true, NOW(), NOW()),
    ('Volume Button', 'Button', 'Button', 22, false, true, NOW(), NOW()),
    ('Home Button', 'Button', 'Button', 23, false, true, NOW(), NOW()),
    ('Water Damage', 'Repair', 'Repair', 24, false, true, NOW(), NOW()),
    ('Logic Board', 'Repair', 'Repair', 25, false, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET
    subcategory = EXCLUDED.subcategory,
    category = EXCLUDED.category,
    "displayOrder" = EXCLUDED."displayOrder",
    "isMainCategory" = EXCLUDED."isMainCategory";

-- Step 5: Show results
SELECT
    "displayOrder",
    name,
    category,
    subcategory,
    "isMainCategory"
FROM repair_types
ORDER BY "displayOrder" ASC NULLS LAST;
