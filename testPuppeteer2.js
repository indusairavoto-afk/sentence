import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  await page.goto('https://chatgpt.com/share/e/672cbb09-5e04-8010-8b17-062e1e075cd6', { waitUntil: 'networkidle2', timeout: 30000 });
  
  const content = await page.content();
  fs.writeFileSync('page_dump.html', content);
  console.log("Dumped. Checking generic JSON:");
  
  console.log("remixContext =>", content.includes('__remixContext'));
  
  await browser.close();
})();
