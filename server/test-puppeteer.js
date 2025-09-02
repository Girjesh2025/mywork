const puppeteer = require('puppeteer');

async function testPuppeteer() {
  console.log('Starting Puppeteer test...');
  
  let browser;
  try {
    console.log('Launching browser...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
    console.log('Browser launched successfully');
    
    const page = await browser.newPage();
    console.log('New page created');
    
    console.log('Navigating to https://example.com...');
    await page.goto('https://example.com', { waitUntil: 'networkidle0', timeout: 10000 });
    console.log('Page loaded successfully');
    
    console.log('Taking screenshot...');
    const screenshot = await page.screenshot({ fullPage: true });
    console.log(`Screenshot taken, size: ${screenshot.length} bytes`);
    
    await browser.close();
    console.log('Browser closed successfully');
    
    return screenshot;
  } catch (error) {
    console.error('Puppeteer error:', error);
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

testPuppeteer()
  .then((screenshot) => {
    console.log('Test completed successfully!');
    console.log(`Final screenshot size: ${screenshot.length} bytes`);
  })
  .catch((error) => {
    console.error('Test failed:', error.message);
    process.exit(1);
  });