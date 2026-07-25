const { getPool } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    console.log('🔄 Running database migrations...');
    const migrationPath = path.join(__dirname, 'migrations', '001_initial_schema.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    await client.query(sql);
    console.log('✅ Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

migrate();
