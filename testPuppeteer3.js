import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';

puppeteer.use(StealthPlugin());

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });
  const page = await browser.newPage();
  
  // Set a realistic User Agent
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  await page.goto('https://chatgpt.com/share/e/672cbb09-5e04-8010-8b17-062e1e075cd6', { waitUntil: 'networkidle2', timeout: 30000 });
  
  const content = await page.content();
  fs.writeFileSync('page_dump_stealth.html', content);
  console.log("Dumped. Checking generic JSON:");
  
  console.log("remixContext =>", content.includes('__remixContext'));
  console.log("Just a moment =>", content.includes('Just a moment...'));
  
  await browser.close();
})();
