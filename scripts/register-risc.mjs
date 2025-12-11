// RISC Registration Script
// Run with: node scripts/register-risc.mjs

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load service account credentials
const credentialsPath = path.join(__dirname, '..', 'inbound-avatar-480003-k8-d8bc2dd58b69.json');
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

const RISC_ENDPOINT = 'https://gatherly.now/api/risc-receiver';

// Create JWT for authentication
function createJWT() {
  const now = Math.floor(Date.now() / 1000);
  
  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: credentials.private_key_id
  };
  
  const payload = {
    iss: credentials.client_email,
    sub: credentials.client_email,
    aud: 'https://risc.googleapis.com/google.identity.risc.v1beta.RiscManagementService',
    iat: now,
    exp: now + 3600
  };
  
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signatureInput);
  const signature = sign.sign(credentials.private_key, 'base64url');
  
  return `${signatureInput}.${signature}`;
}

// Register RISC endpoint
async function registerRISC() {
  console.log('🔐 Generating JWT token...');
  const token = createJWT();
  
  console.log('📡 Registering RISC endpoint:', RISC_ENDPOINT);
  
  const response = await fetch('https://risc.googleapis.com/v1beta/stream:update', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      delivery: {
        delivery_method: 'https://schemas.openid.net/secevent/risc/delivery-method/push',
        url: RISC_ENDPOINT
      },
      events_requested: [
        'https://schemas.openid.net/secevent/risc/event-type/sessions-revoked',
        'https://schemas.openid.net/secevent/oauth/event-type/tokens-revoked',
        'https://schemas.openid.net/secevent/oauth/event-type/token-revoked',
        'https://schemas.openid.net/secevent/risc/event-type/account-disabled',
        'https://schemas.openid.net/secevent/risc/event-type/account-enabled',
        'https://schemas.openid.net/secevent/risc/event-type/account-credential-change-required',
        'https://schemas.openid.net/secevent/risc/event-type/verification'
      ]
    })
  });
  
  if (response.ok) {
    console.log('✅ RISC endpoint registered successfully!');
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    // Now test it
    console.log('\n🧪 Sending verification test...');
    await testRISC(token);
  } else {
    console.error('❌ Failed to register:', response.status);
    const error = await response.text();
    console.error('Error:', error);
  }
}

// Test RISC by sending verification event
async function testRISC(token) {
  const response = await fetch('https://risc.googleapis.com/v1beta/stream:verify', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      state: `test-${Date.now()}`
    })
  });
  
  if (response.ok) {
    console.log('✅ Verification test sent! Check your Vercel logs for the event.');
  } else {
    console.error('❌ Verification failed:', response.status);
    const error = await response.text();
    console.error('Error:', error);
  }
}

// Run
registerRISC().catch(console.error);
