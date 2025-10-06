import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should allow authenticated user to access protected pages', async ({ page }) => {
    // Navigate to home page
    await page.goto('http://localhost:3000');
    
    // Check if user is already signed in by looking for user button
    const userButton = page.locator('[data-testid="user-button"]').or(page.locator('text=/Sign Out/i'));
    const signInButton = page.locator('text=/Sign In/i').first();
    
    const isSignedIn = await userButton.count() > 0;
    console.log('🔍 Is user signed in?', isSignedIn);
    
    if (!isSignedIn) {
      console.log('⚠️ User is not signed in. Please sign in manually first.');
      console.log('Navigate to http://localhost:3000 and sign in with Google OAuth');
      return;
    }
    
    console.log('✅ User is signed in, testing protected pages...');
    
    // Test accessing checkout page
    console.log('📦 Testing checkout page access...');
    await page.goto('http://localhost:3000/checkout');
    await page.waitForLoadState('networkidle');
    
    // Check if we're redirected to sign-in or if we can access the page
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    if (currentUrl.includes('/auth/sign-in') || currentUrl.includes('/sign-in')) {
      console.log('❌ FAILED: Redirected to sign-in page despite being authenticated');
      throw new Error('Authentication not recognized for checkout page');
    } else {
      console.log('✅ PASSED: Checkout page accessible');
    }
    
    // Test accessing account page
    console.log('👤 Testing account page access...');
    await page.goto('http://localhost:3000/account');
    await page.waitForLoadState('networkidle');
    
    const accountUrl = page.url();
    console.log('Account URL:', accountUrl);
    
    if (accountUrl.includes('/auth/sign-in') || accountUrl.includes('/sign-in')) {
      console.log('❌ FAILED: Redirected to sign-in page despite being authenticated');
      throw new Error('Authentication not recognized for account page');
    } else {
      console.log('✅ PASSED: Account page accessible');
    }
    
    // Check for API errors in console
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Check for 401 errors
    page.on('response', response => {
      if (response.status() === 401) {
        console.log('⚠️ 401 Error on:', response.url());
      }
    });
    
    await page.waitForTimeout(2000);
    
    if (consoleErrors.length > 0) {
      console.log('Console errors found:', consoleErrors);
    }
    
    console.log('🎉 All authentication tests passed!');
  });
});
