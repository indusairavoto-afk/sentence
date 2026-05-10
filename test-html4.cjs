const cheerio = require('cheerio');
const html = `<div> <div class='markdown'><p>User: It looks like...</p></div> <div class='markdown'><p>📌 Typical URL Format</p></div> <div class='markdown'><p>A web URL...</p></div> </div>`;
const $ = cheerio.load(html);
const qs = '.markdown';
let nodes = $(qs);
const top = [];
nodes.each((_, el) => top.push(el));
console.log(top.length);
