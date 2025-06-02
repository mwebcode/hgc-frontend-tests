const { expect } = require('@playwright/test');

/**
 * Common helper functions that can be used across different brand tests
 */

/**
 * Takes a screenshot with consistent settings
 * @param {Page} page - Playwright page object
 * @param {string} path - Screenshot file path
 */
async function takeScreenshot(page, path) {
  await page.screenshot({ 
    path: path, 
    fullPage: true,
    animations: 'disabled'
  });
}

/**
 * Waits for page to load with pricing content
 * @param {Page} page - Playwright page object
 * @param {number} timeout - Timeout in milliseconds
 */
async function waitForPricingContent(page, timeout = 30000) {
  await page.waitForSelector('text=/R[0-9,]+/', { timeout });
}

/**
 * Logs package verification result
 * @param {string} packageName - Name of the package being verified
 * @param {boolean} found - Whether the package was found
 * @param {string} expectedPrice - Expected price
 * @param {boolean} hasPrice - Whether the expected price was found
 * @param {Array} actualPrices - Array of actual prices found
 */
function logPackageResult(packageName, found, expectedPrice, hasPrice, actualPrices = []) {
  if (found) {
    console.log(`✅ Found package: ${packageName}`);
    if (hasPrice) {
      console.log(`  💰 Price: ✅ Found ${expectedPrice}`);
    } else {
      const pricesText = actualPrices.length > 0 ? actualPrices.join(', ') : 'No prices found';
      console.log(`  💰 Price: ❌ Expected ${expectedPrice}, but found: ${pricesText}`);
    }
  } else {
    console.log(`❌ Package ${packageName} not found`);
  }
}

/**
 * Searches for price near a package element
 * @param {Locator} packageLocator - Package element locator
 * @param {string} expectedPrice - Expected price to search for
 * @returns {Object} Result with hasPrice boolean and actualPrices array
 */
async function findPriceNearPackage(packageLocator, expectedPrice) {
  let hasPrice = false;
  let actualPrices = [];

  // Try exact price match first
  const page = packageLocator.page();
  let priceElement = page.locator(`text=${expectedPrice}`);
  hasPrice = await priceElement.count() > 0;

  // Try price with "pm" suffix
  if (!hasPrice) {
    const priceWithPm = expectedPrice + 'pm';
    priceElement = page.locator(`text=${priceWithPm}`);
    hasPrice = await priceElement.count() > 0;
  }

  // If still not found, search for nearby prices
  if (!hasPrice) {
    try {
      const packageContainer = packageLocator.locator('..').locator('..');
      const nearbyPrices = await packageContainer.locator('text=/R[0-9,]+/').allTextContents();
      actualPrices = nearbyPrices.filter(price => price.trim() !== '');

      // If no prices in immediate container, search broader area
      if (actualPrices.length === 0) {
        const broaderContainer = packageLocator.locator('..').locator('..').locator('..');
        const broaderPrices = await broaderContainer.locator('text=/R[0-9,]+/').allTextContents();
        actualPrices = broaderPrices.filter(price => price.trim() !== '');
      }
    } catch (error) {
      console.log(`    ⚠️ Could not locate prices: ${error.message}`);
    }
  }

  return { hasPrice, actualPrices };
}

/**
 * Handles address input with Google Places autocomplete
 * @param {Page} page - Playwright page object
 * @param {string} addressToType - Address to type
 * @param {Object} locationFilters - Primary and secondary filters for dropdown selection
 * @param {number} inputDelay - Delay after typing
 * @param {number} typingDelay - Delay between keystrokes
 */
async function handleAddressInput(page, addressToType, locationFilters, inputDelay = 2000, typingDelay = 100) {
  const addressInput = page.locator('input[placeholder="Enter your address"]');
  await expect(addressInput).toBeVisible();
  
  await addressInput.focus();
  await addressInput.type(addressToType, { delay: typingDelay });
  console.log(`✏️ Typed address: ${addressToType}`);
  
  await page.waitForTimeout(inputDelay);
  
  // Select from Google Places dropdown
  const addressSuggestion = page.locator('li')
    .filter({ hasText: locationFilters.primary })
    .filter({ hasText: locationFilters.secondary });
  
  await expect(addressSuggestion).toBeVisible({ timeout: 10000 });
  
  const suggestionText = await addressSuggestion.first().textContent();
  console.log(`🎯 Clicking suggestion: "${suggestionText}"`);
  
  await addressSuggestion.first().click();
  console.log(`✅ Selected ${locationFilters.secondary} address`);
}

module.exports = {
  takeScreenshot,
  waitForPricingContent,
  logPackageResult,
  findPriceNearPackage,
  handleAddressInput
};