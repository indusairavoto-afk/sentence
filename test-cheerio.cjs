const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('chatgpt-puppeteer.html', 'utf8');
const $ = cheerio.load(html);

const selectors = [
  '[data-message-author-role]',
  '[data-testid="message"]',
  'article',
];

for (const sel of selectors) {
  console.log(`Selector "${sel}" count:`, $(sel).length);
}

const authorElems = $('[data-message-author-role]');
authorElems.each((i, el) => {
  console.log(`Role: ${$(el).attr('data-message-author-role')}, Text: ${$(el).text().substring(0, 30)}...`);
});