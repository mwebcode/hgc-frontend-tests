// Mweb-specific selectors
const MWEB_SELECTORS = {
  // Common selectors
  addressInput: 'input[placeholder="Enter your address"]',
  pricePattern: 'text=/R[0-9,]+/',
  
  // Navigation tabs
  fibreTab: 'text=FIBRE',
  lteTab: 'text=FIXED LTE',
  simRouterTab: 'text=SIM + ROUTER',
  simOnlyTab: 'text=SIM ONLY',
  
  // Dropdown suggestions
  addressSuggestion: 'li',
  
  // URL patterns
  fibreChoosePlan: '**/fibre/choose-a-plan**',
  lteChoosePlan: '**/lte/choose-a-plan**',
  
  // Provider elements
  evotelProvider: 'text=Evotel',
  zoomProvider: 'text=Zoom',
  telkomProvider: 'text=Telkom',
  mtnProvider: 'text=MTN'
};

module.exports = { MWEB_SELECTORS };