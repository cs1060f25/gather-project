import { google } from 'googleapis';
import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

// Verify environment variables
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
  console.error('Missing required environment variables!');
  console.log('Required variables:', {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? '✅' : '❌',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? '✅' : '❌',
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI ? '✅' : '❌'
  });
  process.exit(1);
}

// Initialize OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID?.trim(),
  process.env.GOOGLE_CLIENT_SECRET?.trim(),
  process.env.GOOGLE_REDIRECT_URI?.trim()
);

console.log('OAuth client initialized with redirect URI:', process.env.GOOGLE_REDIRECT_URI);

// Scopes we need
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

// Express server for auth flow
const app = express();

// Generate auth URL
app.get('/auth', (req: Request, res: Response) => {
  console.log('Generating auth URL with client ID:', process.env.GOOGLE_CLIENT_ID);
  try {
    const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // we need refresh token
    scope: SCOPES,
    prompt: 'consent' // force consent screen
  });
    console.log('Generated auth URL:', authUrl);
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).send('Error generating auth URL: ' + error);
  }
});

// Handle callback
app.get('/auth/callback', async (req: Request, res: Response) => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      throw new Error('No code received');
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Store these securely in your database in production
    console.log('\n✨ Auth Success! Add these tokens to your .env:\n');
    console.log(`GOOGLE_ACCESS_TOKEN=${tokens.access_token}`);
    if (tokens.refresh_token) {
      console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    }

    res.send('Auth successful! Check your console for tokens.');
  } catch (error: unknown) {
    console.error('Auth Error:', error);
    res.status(500).send('Auth failed: ' + (error instanceof Error ? error.message : 'Unknown error'));

  }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\n🔐 Auth server running!\n`);
  console.log(`1. Visit http://localhost:${PORT}/auth to start auth flow`);
  console.log(`2. After auth, add the tokens to your .env file`);
  console.log(`3. Then you can run your calendar tests\n`);
});
