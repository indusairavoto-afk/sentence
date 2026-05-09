const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox']});
    const page = await browser.newPage();
    try {
        await page.goto('https://g.co/gemini/share/b5170d10de82', {waitUntil: 'networkidle2'}); // A dummy or old share link, or just gemini.google.com
        const content = await page.content();
        console.log("Size:", content.length);
        const elems = await page.$$('[class*="message"], user-query, model-response, article');
        console.log("Count:", elems.length);
    } catch(e) {
        console.error(e);
    }
    await browser.close();
})();
