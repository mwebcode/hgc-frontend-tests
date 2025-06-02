const { test, expect } = require('@playwright/test');

test.describe('Mweb Fibre Pricing Verification - June 2025 Updates', () => {
  
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

  test('Verify Evotel pricing at Krugersdorp address', async ({ page }) => {
    console.log('🎬 Testing Evotel pricing verification');
    
    await page.goto('/fibre');
    console.log('📄 Loaded fibre page');
    
    const addressInput = page.locator('input[placeholder="Enter your address"]');
    await expect(addressInput).toBeVisible();
    
    // Type address to trigger Google Places suggestions
    await addressInput.focus();
    await addressInput.type('10 Jacob Mare Ave', { delay: 100 });
    console.log('✏️ Typed Evotel test address');
    
    await page.waitForTimeout(2000);
    
    // Select the correct Krugersdorp address from dropdown
    const krugersdorpSuggestion = page.locator('li').filter({ 
      hasText: 'Jacob Mare' 
    }).filter({ 
      hasText: 'Monument, Krugersdorp' 
    });
    
    await expect(krugersdorpSuggestion).toBeVisible({ timeout: 10000 });
    
    const suggestionText = await krugersdorpSuggestion.first().textContent();
    console.log(`🎯 Clicking suggestion: "${suggestionText}"`);
    
    await krugersdorpSuggestion.first().click();
    console.log('✅ Selected Krugersdorp address');
    
    // Wait for redirect to choose-a-plan page
    await page.waitForURL('**/fibre/choose-a-plan**', { timeout: 60000 });
    console.log('🎉 Redirected to choose-a-plan page');
    
    // Wait for pricing content to load (look for any price elements)
    console.log('⏳ Waiting for pricing content to load...');
    await page.waitForSelector('text=/R[0-9,]+pm/', { timeout: 30000 });
    console.log('✅ Pricing content loaded');
    
    await page.screenshot({ 
      path: 'evotel-pricing-verification.png', 
      fullPage: true,
      animations: 'disabled'
    });
    
    // Debug: Show all text that contains Mbps
    const allMbpsText = await page.locator('text=/Mbps/').allTextContents();
    console.log('🔍 All text containing Mbps:', allMbpsText);
    
    // Debug: Look for prices
    const allPrices = await page.locator('text=/R[0-9,]+pm/').allTextContents();
    console.log('💰 All prices found:', allPrices.slice(0, 10));
    
    // Verify Evotel pricing packages
    console.log('🔍 Verifying Evotel pricing packages...');
    
    let foundPackages = 0;
    let totalPackages = evotelExpectedPricing.length;
    
    for (const expected of evotelExpectedPricing) {
      console.log(`\n📦 Checking ${expected.package}...`);
      
      // Look for the package speed (try exact format first, then fallback to speed only)
      let packageLocator = page.getByText(expected.package);
      if (await packageLocator.count() === 0) {
        // Fallback: try to find just the speed part (e.g., "20Mbps" from "20↑20Mbps")
        const speedOnly = expected.package.split('↑')[0] + 'Mbps';
        packageLocator = page.getByText(speedOnly);
        console.log(`  🔍 Fallback search for: ${speedOnly}`);
      }
      
      if (await packageLocator.count() > 0) {
        console.log(`✅ Found package: ${expected.package}`);
        foundPackages++;
        
        // Look for deal price anywhere on the page (simpler approach)
        const dealPriceElement = page.locator(`text=${expected.dealPrice}`);
        const hasDealPrice = await dealPriceElement.count() > 0;
        
        // Look for original price anywhere on the page
        const originalPriceElement = page.locator(`text=${expected.originalPrice}`);
        const hasOriginalPrice = await originalPriceElement.count() > 0;
        
        console.log(`  💰 Deal price ${expected.dealPrice}: ${hasDealPrice ? '✅ Found' : '❌ Missing'}`);
        console.log(`  💸 Original price ${expected.originalPrice}: ${hasOriginalPrice ? '✅ Found' : '❌ Missing'}`);
        
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
        
        expect(hasDealPrice, `Deal price ${expected.dealPrice} for ${expected.package}`).toBeTruthy();
        
      } else {
        console.log(`❌ Package ${expected.package} not found`);
        expect.soft(false, `Expected package ${expected.package} to be found`).toBeTruthy();
      }
    }
    
    console.log(`\n📊 Evotel Summary: Found ${foundPackages}/${totalPackages} packages on pricing page`);
    console.log('✅ Evotel pricing verification complete');
  });

  test('Verify Zoom pricing at Pietermaritzburg address', async ({ page }) => {
    console.log('🎬 Testing Zoom pricing verification');
    
    await page.goto('/fibre');
    console.log('📄 Loaded fibre page');
    
    const addressInput = page.locator('input[placeholder="Enter your address"]');
    await expect(addressInput).toBeVisible();
    
    // Type address to trigger Google Places suggestions  
    await addressInput.focus();
    await addressInput.type('66 Reservior Rd', { delay: 100 });
    console.log('✏️ Typed Zoom test address');
    
    await page.waitForTimeout(2000);
    
    // Select the correct Pietermaritzburg address from dropdown
    const pietermaritzburgSuggestion = page.locator('li').filter({ 
      hasText: 'Reservior' 
    }).filter({ 
      hasText: 'Pietermaritzburg' 
    });
    
    await expect(pietermaritzburgSuggestion).toBeVisible({ timeout: 10000 });
    
    const suggestionText = await pietermaritzburgSuggestion.first().textContent();
    console.log(`🎯 Clicking suggestion: "${suggestionText}"`);
    
    await pietermaritzburgSuggestion.first().click();
    console.log('✅ Selected Pietermaritzburg address');
    
    // Wait for redirect to choose-a-plan page
    await page.waitForURL('**/fibre/choose-a-plan**', { timeout: 60000 });
    console.log('🎉 Redirected to choose-a-plan page');
    
    // Wait for pricing content to load (look for any price elements)
    console.log('⏳ Waiting for pricing content to load...');
    await page.waitForSelector('text=/R[0-9,]+pm/', { timeout: 30000 });
    console.log('✅ Pricing content loaded');
    
    await page.screenshot({ 
      path: 'zoom-pricing-verification.png', 
      fullPage: true,
      animations: 'disabled'
    });
    
    // Debug: Show all text that contains Mbps
    const allMbpsText = await page.locator('text=/Mbps/').allTextContents();
    console.log('🔍 All text containing Mbps:', allMbpsText);
    
    // Debug: Look for prices
    const allPrices = await page.locator('text=/R[0-9,]+pm/').allTextContents();
    console.log('💰 All prices found:', allPrices.slice(0, 10));
    
    // Verify Zoom pricing packages
    console.log('🔍 Verifying Zoom pricing packages...');
    
    let foundPackages = 0;
    let totalPackages = zoomExpectedPricing.length;
    
    for (const expected of zoomExpectedPricing) {
      console.log(`\n📦 Checking ${expected.package}...`);
      
      // Look for the package speed (try exact format first, then fallback to speed only)
      let packageLocator = page.getByText(expected.package);
      if (await packageLocator.count() === 0) {
        // Fallback: try to find just the speed part (e.g., "20Mbps" from "20↑20Mbps")
        const speedOnly = expected.package.split('↑')[0] + 'Mbps';
        packageLocator = page.getByText(speedOnly);
        console.log(`  🔍 Fallback search for: ${speedOnly}`);
      }
      
      if (await packageLocator.count() > 0) {
        console.log(`✅ Found package: ${expected.package}`);
        foundPackages++;
        
        // Look for deal price anywhere on the page (simpler approach)
        const dealPriceElement = page.locator(`text=${expected.dealPrice}`);
        const hasDealPrice = await dealPriceElement.count() > 0;
        
        // Look for original price anywhere on the page
        const originalPriceElement = page.locator(`text=${expected.originalPrice}`);
        const hasOriginalPrice = await originalPriceElement.count() > 0;
        
        console.log(`  💰 Deal price ${expected.dealPrice}: ${hasDealPrice ? '✅ Found' : '❌ Missing'}`);
        console.log(`  💸 Original price ${expected.originalPrice}: ${hasOriginalPrice ? '✅ Found' : '❌ Missing'}`);
        
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
        
        expect(hasDealPrice, `Deal price ${expected.dealPrice} for ${expected.package}`).toBeTruthy();
        
      } else {
        console.log(`❌ Package ${expected.package} not found`);
        expect.soft(false, `Expected package ${expected.package} to be found`).toBeTruthy();
      }
    }
    
    console.log(`\n📊 Zoom Summary: Found ${foundPackages}/${totalPackages} packages on pricing page`);
    console.log('✅ Zoom pricing verification complete');
  });
});