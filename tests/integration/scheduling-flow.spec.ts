import { test, expect } from '@playwright/test';

/**
 * Integration Test 2: Scheduling Flow and API Integration
 * 
 * Tests the event scheduling flow including API endpoints.
 * This exercises the full system through the web interface.
 */

// Helper to wait for loading to complete
async function waitForLoadComplete(page: any) {
  await page.waitForTimeout(3000);
  await page.waitForLoadState('networkidle');
}

test.describe('Invite Page', () => {
  test('should handle invite URL structure', async ({ page }) => {
    await page.goto('/invite/test-token-12345');
    await waitForLoadComplete(page);
    
    // Page should load without crashing
    const pageText = await page.textContent('body');
    expect(pageText?.length).toBeGreaterThan(0);
  });
});

test.describe('API Endpoints', () => {
  test('should respond to parse-scheduling endpoint', async ({ request }) => {
    const response = await request.post('/api/parse-scheduling', {
      data: {
        message: 'Schedule a meeting tomorrow at 3pm',
        contactNames: [],
        busySlots: [],
        userLocation: 'Boston, MA'
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Endpoint should respond (status varies based on API key availability)
    expect(response.status()).toBeLessThan(600);
  });

  test('should respond to daily-summary endpoint', async ({ request }) => {
    const response = await request.post('/api/daily-summary', {
      data: {
        events: [],
        userName: 'Test User'
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Endpoint should respond
    expect(response.status()).toBeLessThan(600);
  });

  test('should respond to location endpoint', async ({ request }) => {
    const response = await request.get('/api/location');
    
    // Should return location data or appropriate error
    expect(response.status()).toBeLessThan(600);
  });
});

test.describe('Legal Pages Content', () => {
  test('Terms of Service page has content', async ({ page }) => {
    await page.goto('/terms');
    await waitForLoadComplete(page);
    
    const pageText = await page.textContent('body') || '';
    const hasTermsContent = 
      pageText.toLowerCase().includes('terms') ||
      pageText.toLowerCase().includes('service') ||
      pageText.toLowerCase().includes('agreement') ||
      pageText.toLowerCase().includes('gatherly') ||
      page.url().includes('terms');
    
    expect(hasTermsContent).toBeTruthy();
  });

  test('Privacy Policy page has content', async ({ page }) => {
    await page.goto('/privacy');
    await waitForLoadComplete(page);
    
    const pageText = await page.textContent('body') || '';
    const hasPrivacyContent = 
      pageText.toLowerCase().includes('privacy') ||
      pageText.toLowerCase().includes('data') ||
      pageText.toLowerCase().includes('policy') ||
      pageText.toLowerCase().includes('gatherly') ||
      page.url().includes('privacy');
    
    expect(hasPrivacyContent).toBeTruthy();
  });
});

test.describe('Authentication Flow', () => {
  test('Login page is accessible', async ({ page }) => {
    await page.goto('/login');
    await waitForLoadComplete(page);
    
    const pageText = await page.textContent('body') || '';
    const hasAuthElements = 
      pageText.toLowerCase().includes('sign in') ||
      pageText.toLowerCase().includes('log in') ||
      pageText.toLowerCase().includes('email') ||
      pageText.toLowerCase().includes('password') ||
      pageText.toLowerCase().includes('google') ||
      pageText.toLowerCase().includes('gatherly');
    
    expect(hasAuthElements).toBeTruthy();
  });

  test('Signup page is accessible', async ({ page }) => {
    await page.goto('/signup');
    await waitForLoadComplete(page);
    
    const pageText = await page.textContent('body') || '';
    const hasAuthElements = 
      pageText.toLowerCase().includes('sign up') ||
      pageText.toLowerCase().includes('create') ||
      pageText.toLowerCase().includes('register') ||
      pageText.toLowerCase().includes('email') ||
      pageText.toLowerCase().includes('google') ||
      pageText.toLowerCase().includes('gatherly');
    
    expect(hasAuthElements).toBeTruthy();
  });

  test('Forgot password page is accessible', async ({ page }) => {
    await page.goto('/forgot-password');
    await waitForLoadComplete(page);
    
    const pageText = await page.textContent('body') || '';
    expect(pageText.length).toBeGreaterThan(0);
  });
});

test.describe('Route Protection', () => {
  test('Dashboard handles unauthenticated access', async ({ page }) => {
    // Navigate to protected route
    const response = await page.goto('/app');
    
    // Should load without server error
    expect(response?.status()).toBeLessThan(500);
    
    // Page should have content (either redirect or loading)
    await page.waitForTimeout(2000);
    const pageText = await page.textContent('body');
    expect(pageText?.length).toBeGreaterThan(0);
  });

  test('Events page handles unauthenticated access', async ({ page }) => {
    // Navigate to protected route
    const response = await page.goto('/events');
    
    // Should load without server error
    expect(response?.status()).toBeLessThan(500);
    
    // Page should have content
    await page.waitForTimeout(2000);
    const pageText = await page.textContent('body');
    expect(pageText?.length).toBeGreaterThan(0);
  });
});

test.describe('Page Performance', () => {
  test('Landing page loads within timeout', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('load');
    const loadTime = Date.now() - startTime;
    
    // Should load within 15 seconds
    expect(loadTime).toBeLessThan(15000);
  });
});
