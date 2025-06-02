// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './brands',
  timeout: 120000, // 2 minutes for entire test
  expect: {
    timeout: 10000, // 10 seconds for expect assertions
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  outputDir: './test-results',
  use: {
    actionTimeout: 30000, // 30 seconds for actions like click, fill
    navigationTimeout: 90000, // 90 seconds for page navigation
    trace: 'on',
    video: 'on',
    screenshot: 'on',
    fullPage: true,
    viewport: { width: 1920, height: 1080 },
  },

  projects: [
    // Mweb Production
    {
      name: 'mweb-prod-chrome',
      testDir: './brands/mweb/tests',
      outputDir: './test-results/mweb',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'https://mweb.co.za/',
      },
    },
    // Mweb Development  
    {
      name: 'mweb-dev-chrome',
      testDir: './brands/mweb/tests',
      outputDir: './test-results/mweb',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'https://dev.mwebaws.co.za/',
      },
    },
    // WebAfrica (placeholder for future implementation)
    {
      name: 'webafrica-prod-chrome',
      testDir: './brands/webafrica/tests',
      outputDir: './test-results/webafrica',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'https://webafrica.co.za/', // placeholder URL
      },
    },
  ],
});