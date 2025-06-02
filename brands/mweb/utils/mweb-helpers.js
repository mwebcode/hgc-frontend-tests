const { expect } = require('@playwright/test');
const { TIMEOUTS } = require('../../../shared/utils/timeouts');
const { 
  takeScreenshot, 
  waitForPricingContent, 
  logPackageResult, 
  findPriceNearPackage,
  handleAddressInput 
} = require('../../../shared/utils/common-helpers');
const { MWEB_SELECTORS } = require('../config/selectors');

/**
 * Mweb-specific helper functions
 */

/**
 * Navigate to Mweb fibre page and handle address input
 * @param {Page} page - Playwright page object
 * @param {string} addressToType - Address to type
 * @param {Object} locationFilters - Primary and secondary filters
 */
async function navigateToMwebFibre(page, addressToType, locationFilters) {
  await page.goto('/fibre');
  console.log('📄 Loaded Mweb fibre page');
  
  await handleAddressInput(page, addressToType, locationFilters, TIMEOUTS.INPUT_DELAY, TIMEOUTS.TYPING_DELAY);
  
  // Wait for redirect to choose-a-plan page
  await page.waitForURL(MWEB_SELECTORS.fibreChoosePlan, { timeout: TIMEOUTS.NAVIGATION });
  console.log('🎉 Redirected to fibre choose-a-plan page');
}

/**
 * Navigate to Mweb LTE page and handle address input
 * @param {Page} page - Playwright page object
 * @param {string} addressToType - Address to type
 * @param {Object} locationFilters - Primary and secondary filters
 */
async function navigateToMwebLte(page, addressToType, locationFilters) {
  await page.goto('/lte');
  console.log('📄 Loaded LTE page');
  
  await handleAddressInput(page, addressToType, locationFilters, TIMEOUTS.INPUT_DELAY, TIMEOUTS.TYPING_DELAY);
  
  // Wait for redirect to choose-a-plan page
  await page.waitForURL(MWEB_SELECTORS.lteChoosePlan, { timeout: TIMEOUTS.NAVIGATION });
  console.log('🎉 Redirected to LTE choose-a-plan page');
}

/**
 * Navigate to SIM + ROUTER tab for LTE
 * @param {Page} page - Playwright page object
 */
async function navigateToSimRouterTab(page) {
  console.log('🔍 Looking for SIM + ROUTER tab...');
  const simRouterTab = page.locator(MWEB_SELECTORS.simRouterTab)
    .or(page.locator('text=SIM+ROUTER'))
    .or(page.locator('[role="tab"]:has-text("SIM")'));
  
  if (await simRouterTab.count() > 0) {
    await simRouterTab.first().click();
    console.log('✅ Clicked SIM + ROUTER tab');
    await page.waitForTimeout(2000); // Allow tab content to load
  } else {
    console.log('⚠️ SIM + ROUTER tab not found, proceeding with current view');
  }
}

/**
 * Verify packages and pricing for a provider
 * @param {Page} page - Playwright page object
 * @param {Array} expectedPricing - Array of expected packages and prices
 * @param {string} providerName - Name of the provider
 * @returns {Object} Summary with found/total packages
 */
async function verifyProviderPackages(page, expectedPricing, providerName) {
  console.log(`🔍 Verifying ${providerName} pricing packages...`);
  
  let foundPackages = 0;
  let totalPackages = expectedPricing.length;
  
  for (const expected of expectedPricing) {
    console.log(`\n📦 Checking ${expected.package}...`);
    
    let packageLocator = page.getByText(expected.package);
    let searchUsed = expected.package;
    
    // Try alternative searches if not found
    if (await packageLocator.count() === 0) {
      if (expected.package.includes('Mbps')) {
        // For speed packages, try searching for just the speed part
        const speedPart = expected.package.match(/\d+Mbps/)?.[0];
        if (speedPart) {
          packageLocator = page.locator(`text=${speedPart}`);
          searchUsed = speedPart;
          console.log(`  🔍 Fallback search for speed: ${searchUsed}`);
        }
      } else if (expected.package.includes('Gbps')) {
        // For Gbps packages, try different format variations
        const speedMatch = expected.package.match(/(\d+)Gbps/);
        if (speedMatch) {
          const speed = speedMatch[1];
          const alternatives = [`${speed}Gbps`, `${speed}000Mbps`, `${speed}000↑`];
          
          for (const alt of alternatives) {
            packageLocator = page.locator(`text=${alt}`);
            if (await packageLocator.count() > 0) {
              searchUsed = alt;
              console.log(`  🔍 Found Gbps package with format: ${searchUsed}`);
              break;
            }
          }
        }
      } else {
        // Try searching for just the number part
        const numberPart = expected.package.match(/\d+\.?\d*/)?.[0];
        if (numberPart) {
          packageLocator = page.locator(`text=${numberPart}`);
          searchUsed = numberPart;
          console.log(`  🔍 Fallback search for: ${searchUsed}`);
        }
      }
    }
    
    if (await packageLocator.count() > 0) {
      foundPackages++;
      const { hasPrice, actualPrices } = await findPriceNearPackage(packageLocator, expected.price);
      
      logPackageResult(expected.package, true, expected.price, hasPrice, actualPrices);
      
      // Assert price match with detailed error message
      if (!hasPrice) {
        const errorMsg = actualPrices.length > 0 
          ? `Expected price ${expected.price} for ${expected.package}, but found: ${actualPrices.join(', ')}`
          : `Expected price ${expected.price} for ${expected.package}, but no prices found`;
        expect(hasPrice, errorMsg).toBeTruthy();
      }
    } else {
      logPackageResult(expected.package, false, expected.price, false);
      expect.soft(false, `Expected package ${expected.package} to be found`).toBeTruthy();
    }
  }
  
  return { foundPackages, totalPackages };
}

module.exports = {
  navigateToMwebFibre,
  navigateToMwebLte,
  navigateToSimRouterTab,
  verifyProviderPackages
};