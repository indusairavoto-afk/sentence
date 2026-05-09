const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('gemini_dump_3.html', 'utf8');
const $ = cheerio.load(html);

console.log("user-query:", $('user-query').length);
console.log("model-response:", $('model-response').length);
console.log("user-query, model-response:", $('user-query, model-response').length);
