const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('gemini_dump_3.html', 'utf8');
const $ = cheerio.load(html);

console.log("response-container:", $('response-container').length);
console.log("message-content:", $('message-content').length);
