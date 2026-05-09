const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace('await page.$eval', 'await page.$$$$eval');

fs.writeFileSync('server.ts', content);
