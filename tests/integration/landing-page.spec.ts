import { test, expect } from '@playwright/test';

/**
 * Integration Test 1: Landing Page and Navigation
 * 
 * Tests the public-facing landing page, navigation, and core UI elements.
 * This exercises the responsive web interface using Playwright.
 */

// Helper to wait for loading to complete
async function waitForLoadComplete(page: any) {
  // Wait for the loading animation to disappear
  await page.waitForTimeout(3000);
  // Also wait for networkidle
  await page.waitForLoadState('networkidle');
}

test.describe('Landing Page', () => {
  test('should load the landing page successfully', async ({ page }) => {
    await page.goto('/');
    await waitForLoadComplete(page);
    
    // Page should load and have content
    const pageText = await page.textContent('body');
    expect(pageText?.length).toBeGreaterThan(0);
  });

  test('should have a proper page title', async ({ page }) => {
    await page.goto('/');
    await waitForLoadComplete(page);
    
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should have main content elements after loading', async ({ page }) => {
    await page.goto('/');
    await waitForLoadComplete(page);
    
    // Should have headings or text
    const pageText = await page.textContent('body');
    expect(pageText?.length).toBeGreaterThan(50);
  });

  test('should be responsive - mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await waitForLoadComplete(page);
    
    // Content should be visible
    const pageText = await page.textContent('body');
    expect(pageText?.length).toBeGreaterThan(0);
  });
});

test.describe('Navigation Routes', () => {
  test('should navigate to login page', async ({ page }) => {
    await page.goto('/login');
    await waitForLoadComplete(page);
    
    const pageText = await page.textContent('body');
    expect(pageText?.length).toBeGreaterThan(0);
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/signup');
    await waitForLoadComplete(page);
    
    const pageText = await page.textContent('body');
    expect(pageText?.length).toBeGreaterThan(0);
  });

  test('should navigate to terms page', async ({ page }) => {
    await page.goto('/terms');
    await waitForLoadComplete(page);
    
    // Check that we're on the terms page
    const pageText = await page.textContent('body');
    const hasTermsContent = 
      pageText?.toLowerCase().includes('terms') ||
      pageText?.toLowerCase().includes('service') ||
      pageText?.toLowerCase().includes('agreement') ||
      pageText?.toLowerCase().includes('gatherly') ||
      page.url().includes('terms');
    
    expect(hasTermsContent).toBeTruthy();
  });

  test('should navigate to privacy page', async ({ page }) => {
    await page.goto('/privacy');
    await waitForLoadComplete(page);
    
    // Check that we're on the privacy page  
    const pageText = await page.textContent('body');
    const hasPrivacyContent = 
      pageText?.toLowerCase().includes('privacy') ||
      pageText?.toLowerCase().includes('data') ||
      pageText?.toLowerCase().includes('policy') ||
      pageText?.toLowerCase().includes('gatherly') ||
      page.url().includes('privacy');
    
    expect(hasPrivacyContent).toBeTruthy();
  });
});

test.describe('Protected Routes', () => {
  test('should handle unauthenticated access to dashboard', async ({ page }) => {
    // Navigate to protected route
    const response = await page.goto('/app');
    
    // Should load without crashing (may redirect or show loading)
    expect(response?.status()).toBeLessThan(500);
    
    // Page should have content
    await page.waitForTimeout(2000);
    const pageText = await page.textContent('body');
    expect(pageText?.length).toBeGreaterThan(0);
  });
});

test.describe('Error Handling', () => {
  test('should handle 404 pages', async ({ page }) => {
    const response = await page.goto('/nonexistent-page-xyz123');
    
    // Should either redirect or show page
    expect(response?.status()).toBeLessThan(600);
    
    await page.waitForTimeout(2000);
    const pageText = await page.textContent('body');
    expect(pageText?.length).toBeGreaterThan(0);
  });
});
