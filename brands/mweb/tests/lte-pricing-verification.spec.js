const { test, expect } = require('@playwright/test');

test.describe('LTE Pricing Verification - June 2025 Updates', () => {
  
  // Timeout configurations (in milliseconds)
  const TIMEOUTS = {
    NAVIGATION: 90000,        // 90s for page navigation and redirects
    CONTENT_LOAD: 40000,      // 40s for pricing content to load
    ELEMENT_VISIBLE: 10000,   // 10s for elements to become visible
    INPUT_DELAY: 2000,        // 2s delay after typing for suggestions
    TYPING_DELAY: 100         // 100ms delay between keystrokes
  };
  
  // Expected pricing from June 2025 pricing sheet (based on actual availability at test location)
  const telkomLteExpectedPricing = [
    // Data packages - from SIM + ROUTER tab
    { package: '40GB', price: 'R199', description: 'Telkom LTE 40GB + 40GB Night Time Data' },
    { package: '80GB', price: 'R249', description: 'Telkom LTE 80GB + 80GB Night Time Data' },
    { package: '120GB', price: 'R299', description: 'Telkom LTE 120GB + 120GB Night Time Data' },
    { package: '180GB', price: 'R409', description: 'Telkom LTE 180GB + 180GB Night Time Data' },
    { package: '2TB', price: 'R779', description: 'Telkom LTE 2TB' },
    
    // Uncapped packages - from SIM + ROUTER tab  
    { package: '20Mbps', price: 'R549', description: 'Telkom LTE 20Mbps Uncapped' },
    { package: '30Mbps', price: 'R699', description: 'Telkom LTE 30Mbps Uncapped' }
  ];

  // Reusable function for LTE pricing verification
  async function verifyTelkomLtePricing(page, config) {
    const { 
      providerName, 
      addressToType, 
      locationFilters, 
      expectedPricing, 
      screenshotPath 
    } = config;
    
    console.log(`🎬 Testing ${providerName} LTE pricing verification`);
    
    await page.goto('/lte');
    console.log('📄 Loaded LTE page');
    
    const addressInput = page.locator('input[placeholder="Enter your address"]');
    await expect(addressInput).toBeVisible();
    
    // Type address to trigger Google Places suggestions
    await addressInput.focus();
    await addressInput.type(addressToType, { delay: TIMEOUTS.TYPING_DELAY });
    console.log(`✏️ Typed ${providerName} LTE test address`);
    
    await page.waitForTimeout(TIMEOUTS.INPUT_DELAY);
    
    // Select the correct address from dropdown using provided filters
    const addressSuggestion = page.locator('li')
      .filter({ hasText: locationFilters.primary })
      .filter({ hasText: locationFilters.secondary });
    
    await expect(addressSuggestion).toBeVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE });
    
    const suggestionText = await addressSuggestion.first().textContent();
    console.log(`🎯 Clicking suggestion: "${suggestionText}"`);
    
    await addressSuggestion.first().click();
    console.log(`✅ Selected ${locationFilters.secondary} address`);
    
    // Wait for redirect to choose-a-plan page
    await page.waitForURL('**/lte/choose-a-plan**', { timeout: TIMEOUTS.NAVIGATION });
    console.log('🎉 Redirected to LTE choose-a-plan page');
    
    // Wait for pricing content to load
    console.log('⏳ Waiting for LTE pricing content to load...');
    await page.waitForSelector('text=/R[0-9,]+pm/', { timeout: TIMEOUTS.CONTENT_LOAD });
    console.log('✅ LTE pricing content loaded');
    
    // Navigate to SIM + ROUTER tab
    console.log('🔍 Looking for SIM + ROUTER tab...');
    const simRouterTab = page.locator('text=SIM + ROUTER').or(page.locator('text=SIM+ROUTER')).or(page.locator('[role="tab"]:has-text("SIM")'));
    
    if (await simRouterTab.count() > 0) {
      await simRouterTab.first().click();
      console.log('✅ Clicked SIM + ROUTER tab');
      await page.waitForTimeout(2000); // Allow tab content to load
    } else {
      console.log('⚠️ SIM + ROUTER tab not found, proceeding with current view');
    }
    
    await page.screenshot({ 
      path: screenshotPath, 
      fullPage: true,
      animations: 'disabled'
    });
    
    // Debug: Show all text that contains data indicators
    const allDataText = await page.locator('text=/GB|TB|Mbps/').allTextContents();
    console.log('🔍 All text containing data amounts:', allDataText.slice(0, 15));
    
    // Debug: Look for prices
    const allPrices = await page.locator('text=/R[0-9,]+/').allTextContents();
    console.log('💰 All prices found:', allPrices.slice(0, 10));
    
    // Verify LTE pricing packages
    console.log(`🔍 Verifying ${providerName} LTE pricing packages...`);
    
    let foundPackages = 0;
    let totalPackages = expectedPricing.length;
    
    for (const expected of expectedPricing) {
      console.log(`\n📦 Checking ${expected.package}...`);
      
      // Look for the package data amount/speed
      let packageLocator = page.getByText(expected.package);
      let searchUsed = expected.package;
      
      // Try alternative searches if not found
      if (await packageLocator.count() === 0) {
        if (expected.package.includes('Mbps Uncapped')) {
          // For Mbps Uncapped packages, try searching for just the speed part
          const speedPart = expected.package.match(/\d+Mbps/)?.[0];
          if (speedPart) {
            packageLocator = page.locator(`text=${speedPart}`);
            searchUsed = speedPart;
            console.log(`  🔍 Fallback search for speed: ${searchUsed}`);
          }
        } else {
          // Try searching for just the number part (e.g., "120" from "120GB")
          const numberPart = expected.package.match(/\d+\.?\d*/)?.[0];
          if (numberPart) {
            packageLocator = page.locator(`text=${numberPart}`);
            searchUsed = numberPart;
            console.log(`  🔍 Fallback search for: ${searchUsed}`);
          }
        }
      }
      
      if (await packageLocator.count() > 0) {
        console.log(`✅ Found package: ${expected.package}`);
        foundPackages++;
        
        // Look for price anywhere on the page (try exact match first, then with formatting)
        let priceElement = page.locator(`text=${expected.price}`);
        let hasPrice = await priceElement.count() > 0;
        
        // If not found, try price with "pm" suffix
        if (!hasPrice) {
          const priceWithPm = expected.price + 'pm';
          priceElement = page.locator(`text=${priceWithPm}`);
          hasPrice = await priceElement.count() > 0;
        }
        
        // If expected price not found, try to find what prices are actually there
        let actualPrices = [];
        if (!hasPrice) {
          try {
            // Try to find the package container and look for nearby prices
            const packageContainer = packageLocator.locator('..').locator('..');
            const nearbyPrices = await packageContainer.locator('text=/R[0-9,]+/').allTextContents();
            actualPrices = nearbyPrices.filter(price => price.trim() !== '');
            
            // If no prices found in container, search broader area
            if (actualPrices.length === 0) {
              const broaderContainer = packageLocator.locator('..').locator('..').locator('..');
              const broaderPrices = await broaderContainer.locator('text=/R[0-9,]+/').allTextContents();
              actualPrices = broaderPrices.filter(price => price.trim() !== '');
            }
          } catch (error) {
            console.log(`    ⚠️ Could not locate prices for ${expected.package}: ${error.message}`);
          }
        }
        
        if (hasPrice) {
          console.log(`  💰 Price: ✅ Found ${expected.price}`);
        } else {
          console.log(`  💰 Price: ❌ Expected ${expected.price}, but found: ${actualPrices.length > 0 ? actualPrices.join(', ') : 'No prices found'}`);
        }
        
        // Provide detailed error message for pricing mismatches
        if (!hasPrice) {
          const errorMsg = actualPrices.length > 0 
            ? `Expected price ${expected.price} for ${expected.package}, but found: ${actualPrices.join(', ')}`
            : `Expected price ${expected.price} for ${expected.package}, but no prices found`;
          expect(hasPrice, errorMsg).toBeTruthy();
        }
        
      } else {
        console.log(`❌ Package ${expected.package} not found`);
        expect.soft(false, `Expected package ${expected.package} to be found`).toBeTruthy();
      }
    }
    
    console.log(`\n📊 ${providerName} LTE Summary: Found ${foundPackages}/${totalPackages} packages on pricing page`);
    console.log(`✅ ${providerName} LTE pricing verification complete`);
  }

  test('Verify Telkom Fixed LTE pricing at Cape Town address', async ({ page }) => {
    await verifyTelkomLtePricing(page, {
      providerName: 'Telkom',
      addressToType: '4 Ocean View Rd',
      locationFilters: {
        primary: 'Ocean View',
        secondary: 'Cape Town'
      },
      expectedPricing: telkomLteExpectedPricing,
      screenshotPath: 'lte-pricing-verification.png'
    });
  });
});