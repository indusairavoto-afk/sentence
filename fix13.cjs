const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Fix typo `i;i;`
content = content.replace(/i;i;/g, 'i;');

// Fix tagName in Puppeteer logic (around line 173)
const puppeteerOld = `const tagName = ($el.prop('tagName') || el.tagName || '').toLowerCase();`;
const puppeteerNew = `const tagName = (el.tagName || '').toLowerCase();`;
// Only replace the first occurrence
let firstIdx = content.indexOf(puppeteerOld);
if (firstIdx !== -1) {
    content = content.substring(0, firstIdx) + puppeteerNew + content.substring(firstIdx + puppeteerOld.length);
}

// Fix tagName in Cheerio logic (around line 746)
const cheerioOld = `const tagName = ($el.prop('tagName') || el.tagName || '').toLowerCase();`;
const cheerioNew = `const tagName = ($el.prop('tagName') || el.name || el.tagName || '').toLowerCase();`;
content = content.replace(cheerioOld, cheerioNew);

fs.writeFileSync('server.ts', content);
