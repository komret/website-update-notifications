const { chromium } = require('playwright');
const { sendNotification } = require('./notifier');

const sites = [
  // require('./sites/lotus-clinic'),
  require('./sites/cardgamegeek-warcry'),
];

async function main() {
  const browser = await chromium.launch();

  for (const site of sites) {
    console.log(`Checking ${site.name}...`);
    const result = await site.check(browser);
    if (result) {
      await sendNotification(result);
    }
  }

  await browser.close();
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
