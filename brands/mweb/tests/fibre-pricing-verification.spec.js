const { test, expect } = require('@playwright/test');

test.describe('Mweb Fibre Pricing Verification - June 2025 Updates', () => {
  
  // Timeout configurations (in milliseconds)
  const TIMEOUTS = {
    NAVIGATION: 90000,        // 90s for page navigation and redirects
    CONTENT_LOAD: 30000,      // 30s for pricing content to load
    ELEMENT_VISIBLE: 10000,   // 10s for elements to become visible
    INPUT_DELAY: 2000,        // 2s delay after typing for suggestions
    TYPING_DELAY: 100         // 100ms delay between keystrokes
  };
  
  // Expected pricing from June 2025 pricing sheet (based on actual screenshot format)
  const evotelExpectedPricing = [
    { package: '20↑20Mbps', dealPrice: 'R559pm', originalPrice: 'R659pm' },
    { package: '60↑60Mbps', dealPrice: 'R709pm', originalPrice: 'R809pm' },
    { package: '150↑150Mbps', dealPrice: 'R869pm', originalPrice: 'R969pm' },
    { package: '250↑250Mbps', dealPrice: 'R1039pm', originalPrice: 'R1139pm' },
    { package: '300↑300Mbps', dealPrice: 'R1269pm', originalPrice: 'R1369pm' },
    { package: '850↑850Mbps', dealPrice: 'R1349pm', originalPrice: 'R1449pm' }
  ];

  const zoomExpectedPricing = [
    { package: '30↑30Mbps', dealPrice: 'R335pm', originalPrice: 'R485pm' },
    { package: '50↑50Mbps', dealPrice: 'R545pm', originalPrice: 'R695pm' },
    { package: '100↑100Mbps', dealPrice: 'R769pm', originalPrice: 'R919pm' },
    { package: '200↑200Mbps', dealPrice: 'R889pm', originalPrice: 'R1039pm' },
    { package: '500↑250Mbps', dealPrice: 'R1059pm', originalPrice: 'R1209pm' },
    { package: '1Gbps↑500Mbps', dealPrice: 'R1209pm', originalPrice: 'R1359pm' }
  ];

  // Reusable function for pricing verification
  async function verifyProviderPricing(page, config) {
    const { 
      providerName, 
      addressToType, 
      locationFilters, 
      expectedPricing, 
      screenshotPath 
    } = config;
    
    console.log(`🎬 Testing ${providerName} pricing verification`);
    
    await page.goto('/fibre');
    console.log('📄 Loaded fibre page');
    
    const addressInput = page.locator('input[placeholder="Enter your address"]');
    await expect(addressInput).toBeVisible();
    
    // Type address to trigger Google Places suggestions
    await addressInput.focus();
    await addressInput.type(addressToType, { delay: TIMEOUTS.TYPING_DELAY });
    console.log(`✏️ Typed ${providerName} test address`);
    
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
    await page.waitForURL('**/fibre/choose-a-plan**', { timeout: TIMEOUTS.NAVIGATION });
    console.log('🎉 Redirected to choose-a-plan page');
    
    // Wait for pricing content to load
    console.log('⏳ Waiting for pricing content to load...');
    await page.waitForSelector('text=/R[0-9,]+pm/', { timeout: TIMEOUTS.CONTENT_LOAD });
    console.log('✅ Pricing content loaded');
    
    await page.screenshot({ 
      path: screenshotPath, 
      fullPage: true,
      animations: 'disabled'
    });
    
    // Debug: Show all text that contains Mbps
    const allMbpsText = await page.locator('text=/Mbps/').allTextContents();
    console.log('🔍 All text containing Mbps:', allMbpsText);
    
    // Debug: Look for prices
    const allPrices = await page.locator('text=/R[0-9,]+pm/').allTextContents();
    console.log('💰 All prices found:', allPrices.slice(0, 10));
    
    // Verify pricing packages
    console.log(`🔍 Verifying ${providerName} pricing packages...`);
    
    let foundPackages = 0;
    let totalPackages = expectedPricing.length;
    
    for (const expected of expectedPricing) {
      console.log(`\n📦 Checking ${expected.package}...`);
      
      // Look for the package speed (try exact format first, then fallback approaches)
      let packageLocator = page.getByText(expected.package);
      let searchUsed = expected.package;
      
      if (await packageLocator.count() === 0) {
        // Fallback 1: try to find just the download speed (e.g., "20Mbps" from "20↑20Mbps")
        const downloadSpeed = expected.package.split('↑')[0];
        if (downloadSpeed.includes('Gbps')) {
          // For Gbps packages, search for just "1Gbps" etc.
          packageLocator = page.getByText(downloadSpeed);
          searchUsed = downloadSpeed;
        } else {
          // For Mbps packages, add "Mbps" if not present
          const speedOnly = downloadSpeed.includes('Mbps') ? downloadSpeed : downloadSpeed + 'Mbps';
          packageLocator = page.getByText(speedOnly);
          searchUsed = speedOnly;
        }
        console.log(`  🔍 Fallback search for: ${searchUsed}`);
      }
      
      if (await packageLocator.count() > 0) {
        console.log(`✅ Found package: ${expected.package}`);
        foundPackages++;
        
        // Look for deal price anywhere on the page (try exact match first, then with spaces)
        let dealPriceElement = page.locator(`text=${expected.dealPrice}`);
        let hasDealPrice = await dealPriceElement.count() > 0;
        
        // If not found, try with spaces (e.g., "R1039pm" -> "R1 039pm")
        if (!hasDealPrice) {
          const priceWithSpaces = expected.dealPrice.replace(/(\d{1,3})(\d{3})/g, '$1 $2');
          dealPriceElement = page.locator(`text=${priceWithSpaces}`);
          hasDealPrice = await dealPriceElement.count() > 0;
        }
        
        // Look for original price anywhere on the page (try exact match first, then with spaces)
        let originalPriceElement = page.locator(`text=${expected.originalPrice}`);
        let hasOriginalPrice = await originalPriceElement.count() > 0;
        
        // If not found, try with spaces (e.g., "R1139pm" -> "R1 139pm")
        if (!hasOriginalPrice) {
          const priceWithSpaces = expected.originalPrice.replace(/(\d{1,3})(\d{3})/g, '$1 $2');
          originalPriceElement = page.locator(`text=${priceWithSpaces}`);
          hasOriginalPrice = await originalPriceElement.count() > 0;
        }
        
        // If expected prices not found, try to find what prices are actually there
        let actualPrices = [];
        if (!hasDealPrice || !hasOriginalPrice) {
          try {
            // Try to find the package container and look for nearby prices
            const packageContainer = packageLocator.locator('..').locator('..');
            const nearbyPrices = await packageContainer.locator('text=/R[0-9,]+pm/').allTextContents();
            actualPrices = nearbyPrices.filter(price => price.trim() !== '');
            
            // If no prices found in container, search broader area
            if (actualPrices.length === 0) {
              const broaderContainer = packageLocator.locator('..').locator('..').locator('..');
              const broaderPrices = await broaderContainer.locator('text=/R[0-9,]+pm/').allTextContents();
              actualPrices = broaderPrices.filter(price => price.trim() !== '');
            }
          } catch (error) {
            console.log(`    ⚠️ Could not locate prices for ${expected.package}: ${error.message}`);
          }
        }
        
        if (hasDealPrice) {
          console.log(`  💰 Deal price: ✅ Found ${expected.dealPrice}`);
        } else {
          console.log(`  💰 Deal price: ❌ Expected ${expected.dealPrice}, but found: ${actualPrices.length > 0 ? actualPrices.join(', ') : 'No prices found'}`);
        }
        
        if (hasOriginalPrice) {
          console.log(`  💸 Original price: ✅ Found ${expected.originalPrice}`);
        } else {
          console.log(`  💸 Original price: ❌ Expected ${expected.originalPrice}, but found: ${actualPrices.length > 0 ? actualPrices.join(', ') : 'No prices found'}`);
        }
        
        if (hasDealPrice && hasOriginalPrice) {
          // Check if any instance of the original price has strikethrough styling
          const allOriginalPrices = page.locator(`text=${expected.originalPrice}`);
          const count = await allOriginalPrices.count();
          let hasStrikethrough = false;
          
          for (let i = 0; i < count; i++) {
            const element = allOriginalPrices.nth(i);
            const isStrikethrough = await element.evaluate(el => {
              const style = window.getComputedStyle(el);
              return style.textDecoration.includes('line-through') || 
                     style.textDecorationLine === 'line-through' ||
                     el.style.textDecoration.includes('line-through') ||
                     el.classList.contains('line-through');
            });
            if (isStrikethrough) {
              hasStrikethrough = true;
              break;
            }
          }
          console.log(`  🚫 Original price strikethrough: ${hasStrikethrough ? '✅ Yes' : '⚠️ No'}`);
        }
        
        // Provide detailed error message for pricing mismatches
        if (!hasDealPrice) {
          const errorMsg = actualPrices.length > 0 
            ? `Expected deal price ${expected.dealPrice} for ${expected.package}, but found: ${actualPrices.join(', ')}`
            : `Expected deal price ${expected.dealPrice} for ${expected.package}, but no prices found`;
          expect(hasDealPrice, errorMsg).toBeTruthy();
        }
        
      } else {
        console.log(`❌ Package ${expected.package} not found`);
        expect.soft(false, `Expected package ${expected.package} to be found`).toBeTruthy();
      }
    }
    
    console.log(`\n📊 ${providerName} Summary: Found ${foundPackages}/${totalPackages} packages on pricing page`);
    console.log(`✅ ${providerName} pricing verification complete`);
  }

  test('Verify Evotel pricing at Krugersdorp address', async ({ page }) => {
    await verifyProviderPricing(page, {
      providerName: 'Evotel',
      addressToType: '10 Jacob Mare Ave',
      locationFilters: {
        primary: 'Jacob Mare',
        secondary: 'Monument, Krugersdorp'
      },
      expectedPricing: evotelExpectedPricing,
      screenshotPath: 'evotel-pricing-verification.png'
    });
  });

  test('Verify Zoom pricing at Pietermaritzburg address', async ({ page }) => {
    await verifyProviderPricing(page, {
      providerName: 'Zoom',
      addressToType: '66 Reservior Rd',
      locationFilters: {
        primary: 'Reservior',
        secondary: 'Pietermaritzburg'
      },
      expectedPricing: zoomExpectedPricing,
      screenshotPath: 'zoom-pricing-verification.png'
    });
  });
});