const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox']});
    const page = await browser.newPage();
    try {
        await page.goto('https://g.co/gemini/share/b5170d10de82', {waitUntil: 'networkidle2'});
        const elements = await page.$$('[class*="message"], user-query, model-response, article');
        
        for (const el of elements) {
            const tagName = await el.evaluate(e => e.tagName);
            const className = await el.evaluate(e => e.className);
            const innerText = await el.evaluate(e => e.innerText);
            
            console.log(`[${tagName}] (${className.substring(0, 30)}) TextLen: ${innerText?.length || 0}`);
            if (innerText && innerText.length < 100) {
               console.log("   " + innerText.replace(/\\n/g, ' '));
            }
        }
    } catch(e) {
        console.error(e);
    }
    await browser.close();
})();
