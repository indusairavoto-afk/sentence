const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const exclFind = 'nav, aside, [class*="sidebar"], [class*="menu"], header, [class*="header"], [class*="drawer"]';
const exclRepl = 'nav, aside, [class*="sidebar"], [class*="menu"], header, [class*="header"], .drawer, .drawer-content';

content = content.replace(exclFind, exclRepl);
content = content.replace(exclFind, exclRepl);
content = content.replace(exclFind, exclRepl);

fs.writeFileSync('server.ts', content);
