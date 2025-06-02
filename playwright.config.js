// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on',
    video: 'on',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'prod-chrome',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'https://mweb.co.za/',
      },
    },
    {
      name: 'dev-chrome',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'https://dev.mwebaws.co.za/',
      },
    },
  ],
});