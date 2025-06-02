# HGC Frontend Tests

Multi-brand automated testing suite for frontend pricing verification using Playwright.

## Overview

This test suite verifies that pricing changes are correctly reflected on brand websites. It supports multiple brands with separate test configurations:

- **Mweb** - Fibre and LTE pricing verification 
- **WebAfrica** - (Future implementation)

## Project Structure

```
hgc-frontend-tests/
├── brands/
│   ├── mweb/                    # Mweb-specific tests and data
│   │   ├── config/
│   │   │   ├── test-data/       # Test addresses and pricing data
│   │   │   └── selectors.js     # Mweb-specific selectors
│   │   ├── tests/               # Mweb test files
│   │   └── utils/               # Mweb helper functions
│   └── webafrica/               # WebAfrica tests (future)
│       ├── config/
│       ├── tests/
│       └── utils/
├── shared/                      # Shared utilities across brands
│   ├── utils/                   # Common helper functions
│   └── types/                   # Shared type definitions
└── test-results/                # Brand-specific test outputs
    ├── mweb/
    └── webafrica/
```

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone https://github.com/mwebcode/hgc-frontend-tests.git
cd hgc-frontend-tests
```

2. Install dependencies:
```bash
npm install
```

3. Install Playwright browsers:
```bash
npx playwright install
```

## Test Execution

### Run All Tests
```bash
# Run all Mweb tests on production
npx playwright test --project=mweb-prod-chrome

# Run all Mweb tests on development
npx playwright test --project=mweb-dev-chrome

# Run all brands (when available)
npx playwright test
```

### Run Specific Tests
```bash
# Run only Mweb fibre pricing tests
npx playwright test pricing-verification --project=mweb-prod-chrome

# Run only Mweb LTE pricing tests  
npx playwright test lte-pricing-verification --project=mweb-prod-chrome

# Run with headed browser (visible)
npx playwright test --project=mweb-prod-chrome --headed

# Run specific test by name
npx playwright test "Verify Evotel fibre pricing" --project=mweb-prod-chrome
```

### Debug Mode
```bash
# Run tests in debug mode with browser visible
npx playwright test --project=mweb-prod-chrome --headed --debug

# Run single test with step-by-step debugging
npx playwright test pricing-verification.spec.js --project=mweb-prod-chrome --debug
```

## Brand-Specific Information

### Mweb Tests

**Test Files:**
- `brands/mweb/tests/pricing-verification.spec.js` - Fibre pricing verification
- `brands/mweb/tests/lte-pricing-verification.spec.js` - LTE pricing verification
- `brands/mweb/tests/homepage.spec.js` - Basic homepage smoke test

**Configuration:**
- `brands/mweb/config/test-data/fibre-provider-addresses.md` - Fibre test addresses
- `brands/mweb/config/test-data/lte-provider-addresses.md` - LTE test addresses
- `brands/mweb/config/test-data/pricing-data/` - Pricing reference files

**Test Coverage:**

*Fibre Tests:*
- **Evotel Provider** (Krugersdorp): 9 packages from 30Mbps to 500Mbps
- **Zoom Provider** (Pietermaritzburg): 6 packages from 20Mbps to 850Mbps

*LTE Tests:*
- **Telkom Provider** (Cape Town): 7 packages including data (40GB-2TB) and uncapped (20-30Mbps)

### WebAfrica Tests

WebAfrica test implementation is planned for future development. The structure is prepared in `brands/webafrica/` with placeholder files.

## Shared Utilities

### Common Functions
- `shared/utils/common-helpers.js` - Cross-brand helper functions
- `shared/utils/timeouts.js` - Centralized timeout configurations

### Key Features
- Address input handling with Google Places autocomplete
- Price verification with fallback search strategies
- Screenshot and debugging utilities
- Package detection with multiple format support

## Reports and Debugging

### View Test Reports
```bash
# Open HTML report after test run
npx playwright show-report

# Generate and open report for specific brand
npx playwright test --project=mweb-prod-chrome && npx playwright show-report
```

### Test Artifacts
Tests generate brand-specific artifacts:
- **Screenshots** - Full page screenshots in `test-results/[brand]/`
- **Videos** - Complete test execution recordings  
- **Trace files** - Detailed execution traces with network activity
- **Console logs** - Step-by-step execution details

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Multi-Brand Frontend Tests
on: [push, pull_request]
jobs:
  test-mweb:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npx playwright install --with-deps
      - run: npx playwright test --project=mweb-prod-chrome
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: mweb-test-results
          path: test-results/mweb/
```

### Project Configuration

Projects are defined in `playwright.config.js`:
- `mweb-prod-chrome` - Mweb production testing
- `mweb-dev-chrome` - Mweb development testing  
- `webafrica-prod-chrome` - WebAfrica production (future)

Each project has its own:
- Test directory (`testDir`)
- Output directory (`outputDir`)
- Base URL configuration

## Adding New Brands

To add a new brand:

1. Create brand directory structure:
```bash
mkdir -p brands/newbrand/{config/test-data/pricing-data,tests,utils}
```

2. Add brand-specific files:
- `brands/newbrand/config/selectors.js` - Brand selectors
- `brands/newbrand/utils/newbrand-helpers.js` - Helper functions
- `brands/newbrand/tests/` - Test files

3. Update `playwright.config.js`:
```javascript
{
  name: 'newbrand-prod-chrome',
  testDir: './brands/newbrand/tests',
  outputDir: './test-results/newbrand',
  use: { 
    ...devices['Desktop Chrome'],
    baseURL: 'https://newbrand.co.za/',
  },
}
```

4. Create test results directory:
```bash
mkdir test-results/newbrand
```

## Troubleshooting

### Common Issues

**Tests timing out during address selection:**
- Ensure Google Places API is working
- Check if address suggestions appear in dropdown
- Verify network connectivity

**Pricing not found:**
- Check if packages are available at test location
- Verify pricing data is current in `brands/[brand]/config/test-data/pricing-data/`
- Look for provider availability at address

**Navigation failures:**
- Confirm base URL is accessible in playwright.config.js
- Check for website maintenance or outages
- Verify redirect behavior to choose-a-plan pages

### Brand-Specific Debugging
- Check brand-specific selectors in `brands/[brand]/config/selectors.js`
- Review brand helper functions in `brands/[brand]/utils/`
- Verify test data in `brands/[brand]/config/test-data/`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes following the brand structure
4. Add tests for new functionality
5. Run the test suite: `npm test`
6. Commit your changes: `git commit -m 'Add feature'`
7. Push to the branch: `git push origin feature-name`
8. Submit a pull request

## License

This project is licensed under the MIT License.