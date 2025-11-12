#!/usr/bin/env ts-node
/**
 * Database Connection Test Script
 * Run: npx ts-node scripts/test-db.ts
 */

import { initializeFirebase } from '../lib/db/firebase.config';
import { initializePostgres, query } from '../lib/db/postgres.config';

async function testConnections() {
  console.log('🧪 Testing Gatherly database connections...\n');

  // Test Firebase/Firestore
  console.log('1️⃣  Testing Firebase/Firestore...');
  try {
    const { db, auth } = initializeFirebase();
    console.log(`   ✅ Firebase initialized`);
    console.log(`   📦 Firestore ready`);
    console.log(`   🔐 Auth ready\n`);
  } catch (error) {
    console.error('   ❌ Firebase connection failed:', error);
    console.log('   💡 Check your NEXT_PUBLIC_FIREBASE_* environment variables\n');
  }

  // Test PostgreSQL
  console.log('2️⃣  Testing PostgreSQL...');
  try {
    const pool = initializePostgres();
    
    // Test query
    const result = await query('SELECT NOW() as current_time, version() as pg_version');
    const { current_time, pg_version } = result.rows[0];
    
    console.log(`   ✅ PostgreSQL connected`);
    console.log(`   ⏰ Server time: ${new Date(current_time).toLocaleString()}`);
    console.log(`   📊 Version: ${pg_version.split(' ')[0]} ${pg_version.split(' ')[1]}\n`);
    
    // Check tables
    const tables = await query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    
    console.log(`   📋 Tables found: ${tables.rows[0].count}`);
    
    if (parseInt(tables.rows[0].count) === 0) {
      console.log('   ⚠️  No tables found. Run: npx ts-node scripts/setup-db.ts');
    }
    
    await pool.end();
  } catch (error) {
    console.error('   ❌ PostgreSQL connection failed:', error);
    console.log('   💡 Check your POSTGRES_* environment variables');
    console.log('   💡 Make sure PostgreSQL is running\n');
  }

  console.log('\n✨ Connection test complete!');
}

testConnections();

