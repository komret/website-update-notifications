const BOOKING_URL = 'https://lotus.rezervace.online/cs/service/vstupni-konzultace-16489';

async function findNearestAvailableDate(page) {
  // When the currently selected day has no bookable term, REENIO shows a
  // "přejít na nejbližší volný termín" button with the actual next available
  // date.
  return page.evaluate(() => {
    const span = document.querySelector('button.nearest-term-btn span');
    return span ? span.textContent.replace(/ /g, ' ').trim() : null;
  });
}

module.exports = {
  name: 'Lotus Clinic',
  async check(browser) {
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'cs-CZ,cs;q=0.9' });

    console.log('Loading booking page...');
    await page.goto(BOOKING_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000); // let late JS settle

    const nearestDate = await findNearestAvailableDate(page);
    await page.close();

    if (!nearestDate) {
      console.log('No "nearest available term" prompt found on the page.');
      return null;
    }

    console.log('Nearest available term:', nearestDate);
    return {
      subject: 'Lotus Clinic – volný termín!',
      text: [
        `Nejbližší volný termín vstupní konzultace): ${nearestDate}`,
        '',
        `Rezervace: ${BOOKING_URL}`,
      ].join('\n'),
    };
  },
};
