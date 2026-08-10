const SHOP_URL = 'https://shop.cardgamegeek.com/shop/';
const CATEGORY = 'WarCry CCG';
const SLUG = 'warcry-ccg';

// Notify when WarCry CCG was restocked within this window. The workflow runs once a
// day, so a 24h window means each restock is emailed exactly once — no state to keep.
const RESTOCK_WINDOW_MS = 24 * 60 * 60 * 1000;

// The page ships each category's `latest_stock_increase` timestamp in the Next.js
// data payload (`self.__next_f`) — this is what drives the shop's "restock" icon.
// Returns the newest ISO timestamp for the category, or null if not found.
async function latestStockIncrease(page, slug) {
  return page.evaluate((slug) => {
    const data = (self.__next_f || [])
      .map((chunk) => (Array.isArray(chunk) ? chunk[1] : chunk))
      .filter((s) => typeof s === 'string')
      .join('');
    // Match the top-level category node for this slug ("parent":null) and grab the
    // nearest latest_stock_increase after it. Take the newest across occurrences.
    const re = new RegExp(
      '"slug":"' + slug + '","name":"[^"]*","parent":null[\\s\\S]{0,400}?' +
        '"latest_stock_increase":"([^"]*)"',
      'g'
    );
    let best = null;
    let m;
    while ((m = re.exec(data)) !== null) {
      const v = m[1];
      if (v && v !== '$undefined' && (!best || v > best)) best = v; // ISO sorts chronologically
    }
    return best;
  }, slug);
}

module.exports = {
  name: 'CardGameGeek – WarCry CCG',
  async check(browser) {
    const page = await browser.newPage();

    console.log('Loading CardGameGeek shop...');
    await page.goto(SHOP_URL, { waitUntil: 'networkidle', timeout: 60000 });

    const stockDate = await latestStockIncrease(page, SLUG);
    await page.close();

    if (!stockDate) {
      console.log(`No stock-increase timestamp found for "${CATEGORY}".`);
      return null;
    }

    const ageMs = Date.now() - Date.parse(stockDate);
    if (Number.isNaN(ageMs) || ageMs > RESTOCK_WINDOW_MS) {
      console.log(`"${CATEGORY}" last restocked ${stockDate} — not within the last 24h.`);
      return null;
    }

    console.log(`"${CATEGORY}" restocked ${stockDate} — within the last 24h!`);
    return {
      subject: 'WarCry CCG – restock at CardGameGeek!',
      text: [
        `${CATEGORY} was restocked at CardGameGeek.`,
        `Latest stock increase: ${stockDate}`,
        '',
        `Shop: ${SHOP_URL}`,
      ].join('\n'),
    };
  },
};
