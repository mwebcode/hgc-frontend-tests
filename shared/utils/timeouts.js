// Centralized timeout configurations for all test suites
const TIMEOUTS = {
  NAVIGATION: 90000,        // 90s for page navigation and redirects
  CONTENT_LOAD: 30000,      // 30s for pricing content to load
  ELEMENT_VISIBLE: 10000,   // 10s for elements to become visible
  INPUT_DELAY: 2000,        // 2s delay after typing for suggestions
  TYPING_DELAY: 100         // 100ms delay between keystrokes
};

module.exports = { TIMEOUTS };