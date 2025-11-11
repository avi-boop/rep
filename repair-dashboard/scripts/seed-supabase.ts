/**
 * Seed Supabase database with initial data
 */

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const seeds = [
  // Part Types
  `INSERT INTO part_types (name, "qualityLevel", "warrantyMonths", description, "isActive", "createdAt", "updatedAt")
   VALUES
   ('Standard', 2, 6, 'Standard quality replacement parts', true, NOW(), NOW())
   ON CONFLICT (name) DO NOTHING;`,

  // Repair Types
  `INSERT INTO repair_types (name, category, description, "isActive", "createdAt", "updatedAt")
   VALUES
   ('Front Screen', 'Display', 'Front screen/display replacement', true, NOW(), NOW()),
   ('Back Panel', 'Body', 'Back panel/glass replacement', true, NOW(), NOW()),
   ('Battery', 'Power', 'Battery replacement', true, NOW(), NOW()),
   ('Camera - Rear', 'Camera', 'Rear camera replacement', true, NOW(), NOW()),
   ('Charging Port', 'Port', 'Charging port repair', true, NOW(), NOW()),
   ('Others', 'Miscellaneous', 'Other repairs', true, NOW(), NOW())
   ON CONFLICT (name) DO NOTHING;`,

  // Brand
  `INSERT INTO brands (name, "isPrimary", "createdAt", "updatedAt")
   VALUES ('Apple', true, NOW(), NOW())
   ON CONFLICT (name) DO NOTHING;`,
]

async function seed() {
  console.log('🌱 Seeding Supabase database...\n')

  for (const [index, sql] of seeds.entries()) {
    try {
      const command = `docker exec -i supabase-db-w84occs4w0wks4cc4kc8o484 psql -U supabase_admin -d repair_dashboard -c "${sql.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`

      console.log(`[${index + 1}/${seeds.length}] Running seed...`)
      const { stdout, stderr } = await execAsync(command)

      if (stderr && !stderr.includes('INSERT')) {
        console.error('   ⚠️  Warning:', stderr.trim())
      } else {
        console.log('   ✓ Success')
      }
    } catch (error: any) {
      console.error(`   ❌ Error:`, error.message)
    }
  }

  console.log('\n✅ Seeding complete!')
}

seed().catch(console.error)
