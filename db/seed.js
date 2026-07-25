const { getPool } = require('../config/database');
const bcrypt = require('bcryptjs');

async function seed() {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    console.log('🌱 Seeding database...');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@cemetery.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await client.query(
      `INSERT INTO users (email, password_hash, full_name, role, is_approved)
       VALUES ($1, $2, $3, 'admin', true)
       ON CONFLICT (email) DO UPDATE SET 
         password_hash = EXCLUDED.password_hash,
         full_name = EXCLUDED.full_name`,
      [adminEmail, hashedPassword, 'System Administrator']
    );
    console.log(`✅ Admin user created: ${adminEmail}`);
    console.log('✅ Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

seed();
