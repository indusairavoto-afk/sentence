const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox']});
    const page = await browser.newPage();
    try {
        await page.goto('https://gemini.google.com/app', {waitUntil: 'networkidle2'});
        const elements = await page.$$('user-query, model-response, [class*="user-query"], [class*="model-response"], .chat-message, .message');
        console.log("Found important elements: " + elements.length);
        
        for (const el of elements) {
            const tagName = await el.evaluate(e => e.tagName);
            const className = await el.evaluate(e => e.className);
            const innerText = await el.evaluate(e => e.innerText);
            const isHidden = await el.evaluate(e => {
               const style = window.getComputedStyle(e);
               return style.display === 'none' || style.visibility === 'hidden' || e.closest('[style*="display: none"]');
            });
            console.log(`[${tagName}] (${className}) (Hidden? ${isHidden}) Length: ${innerText.length}`);
            if (innerText.length > 0 && innerText.length < 100) {
                console.log(innerText.replace(/\\n/g, ' '));
            }
        }

    } catch(e) {
        console.error(e);
    }
    await browser.close();
})();
