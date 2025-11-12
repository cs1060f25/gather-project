#!/usr/bin/env ts-node
/**
 * Database Setup Script
 * Run: npx ts-node scripts/setup-db.ts
 */

import { initializePostgres, initializeSchema } from '../lib/db/postgres.config';

async function setupDatabase() {
  console.log('🚀 Setting up Gatherly database...\n');

  try {
    // Initialize PostgreSQL connection
    console.log('1️⃣  Connecting to PostgreSQL...');
    const pool = initializePostgres();
    console.log('   ✅ Connected to PostgreSQL\n');

    // Initialize schema
    console.log('2️⃣  Creating tables...');
    await initializeSchema();
    console.log('   ✅ Tables created successfully\n');

    // Verify tables exist
    console.log('3️⃣  Verifying tables...');
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('   📊 Found tables:');
    result.rows.forEach(row => {
      console.log(`      - ${row.table_name}`);
    });

    console.log('\n✨ Database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();

