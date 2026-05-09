const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox']});
    const page = await browser.newPage();
    try {
        await page.goto('https://gemini.google.com', {waitUntil: 'networkidle2'});
        const content = await page.content();
        if (content.includes('user-query')) {
            console.log("Found user-query!!");
        } else {
            console.log("No user-query, probably login page. Content size: " + content.length);
        }
    } catch(e) {
        console.error(e);
    }
    await browser.close();
})();
