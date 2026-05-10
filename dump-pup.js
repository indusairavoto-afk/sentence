import puppeteer from "puppeteer";
import * as fs from "fs";

(async () => {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto("https://chatgpt.com/share/672eb7d8-eb10-800e-ad6d-e9714fe0edc3", { waitUntil: "networkidle2" });
    console.log("URL:", page.url());
    await page.screenshot({ path: 'chatgpt-screenshot.png' });
    const html = await page.evaluate(() => document.body.innerHTML);
    fs.writeFileSync('chatgpt-puppeteer.html', html);
    await browser.close();
})();
