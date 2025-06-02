# HGC Frontend Tests

Automated testing suite for Mweb fibre pricing verification on production website using Playwright.

## Overview

This test suite verifies that Mweb's latest pricing changes are correctly reflected on the production website for both Evotel and Zoom fibre providers. The tests navigate through the actual user journey from address search to pricing verification.

## Features

- ✅ **Google Places Integration** - Automated address selection using real Google Places autocomplete
- ✅ **Pricing Verification** - Validates both promotional and original pricing with strikethrough detection
- ✅ **Visual Documentation** - Full-page screenshots and video recordings for debugging
- ✅ **Detailed Reporting** - Comprehensive test reports with pricing mismatch analysis
- ✅ **Multiple Providers** - Supports Evotel and Zoom with easy extensibility for new providers

## Quick Start

### Prerequisites

- Node.js (version 16 or higher)
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mwebcode/hgc-frontend-tests.git
   cd hgc-frontend-tests
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install Playwright browsers:**
   ```bash
   npx playwright install
   ```

### Running Tests

#### Run all pricing verification tests:
```bash
npx playwright test
```

#### Run tests against production:
```bash
npx playwright test --project=prod-chrome
```

#### Run specific provider tests:
```bash
# Evotel pricing verification
npx playwright test --grep "Evotel"

# Zoom pricing verification  
npx playwright test --grep "Zoom"
```

#### Run with visual output:
```bash
npx playwright test --headed
```

#### Generate and view test report:
```bash
npx playwright show-report
```

## Test Configuration

### Available Projects
- **prod-chrome** - Tests against production (https://mweb.co.za/)
- **dev-chrome** - Tests against development (https://dev.mwebaws.co.za/)

### Timeout Configuration
Tests use configurable timeouts defined in the test files:
- Navigation: 90 seconds
- Content loading: 30 seconds
- Element visibility: 10 seconds

## Test Coverage

### Evotel Packages (Krugersdorp Address)
- 20↑20Mbps: R559pm (was R659pm)
- 60↑60Mbps: R709pm (was R809pm)
- 150↑150Mbps: R869pm (was R969pm)
- 250↑250Mbps: R1039pm (was R1139pm)
- 300↑300Mbps: R1269pm (was R1369pm)
- 850↑850Mbps: R1349pm (was R1449pm)

### Zoom Packages (Pietermaritzburg Address)
- 30↑30Mbps: R335pm (was R485pm)
- 50↑50Mbps: R545pm (was R695pm)
- 100↑100Mbps: R769pm (was R919pm)
- 200↑200Mbps: R889pm (was R1039pm)
- 500↑250Mbps: R1059pm (was R1209pm)
- 1Gbps↑500Mbps: R1209pm (was R1359pm)

## Debugging

### Screenshots and Videos
- Screenshots are automatically captured for all test runs
- Videos are recorded for failed tests
- Files are saved in `test-results/` directory

### Traces
- Detailed execution traces are captured for debugging
- View traces with: `npx playwright show-trace test-results/.../trace.zip`

### Verbose Output
```bash
npx playwright test --reporter=list
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Pricing Verification Tests
on: [push, pull_request, schedule]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test --project=prod-chrome
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: test-results/
```

### Scheduled Monitoring
Run tests on a schedule to monitor pricing changes:
```yaml
on:
  schedule:
    - cron: '0 9 * * *'  # Daily at 9 AM
```

## Adding New Providers

To add a new provider, update the test file with:

1. **Add expected pricing array:**
```javascript
const newProviderExpectedPricing = [
  { package: '50↑50Mbps', dealPrice: 'R699pm', originalPrice: 'R799pm' },
  // ... more packages
];
```

2. **Add test configuration:**
```javascript
test('Verify NewProvider pricing at TestCity address', async ({ page }) => {
  await verifyProviderPricing(page, {
    providerName: 'NewProvider',
    addressToType: 'Test Street Address',
    locationFilters: {
      primary: 'Test Street',
      secondary: 'TestCity'
    },
    expectedPricing: newProviderExpectedPricing,
    screenshotPath: 'newprovider-pricing-verification.png'
  });
});
```

## Troubleshooting

### Common Issues

**Test timeouts:**
- Increase timeouts in the TIMEOUTS configuration
- Check network connectivity to mweb.co.za

**Address selection fails:**
- Verify Google Places suggestions are loading
- Check address spelling and location filters

**Pricing mismatches:**
- Review screenshots in test-results/
- Check if prices have changed on the website
- Update expected pricing arrays if needed

### Getting Help

1. Check the test report: `npx playwright show-report`
2. Review screenshots and videos in `test-results/`
3. Run with verbose output: `npx playwright test --reporter=list`
4. Open browser in headed mode: `npx playwright test --headed`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests to ensure they pass
5. Submit a pull request

## License

This project is part of the Mweb testing infrastructure.