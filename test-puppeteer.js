import puppeteer from 'puppeteer';
(async () => {
    const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']});
    const page = await browser.newPage();
    await page.goto("https://claude.ai/", {waitUntil: 'networkidle2'});
    const html = await page.content();
    console.log(html.substring(0, 1000));
    await browser.close();
})();
