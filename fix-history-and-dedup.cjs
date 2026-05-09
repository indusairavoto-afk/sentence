const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Fix the closest() exclusion filter in puppeteer
const pupTarget = `el.closest(\n              'nav, aside, [class*="sidebar"], [class*="menu"], [class*="nav"], header, [class*="header"], [class*="history"], [class*="drawer"]',\n            )`;
const pupRepl = `el.closest(\n              'nav, aside, [class*="sidebar"], [class*="menu"], [class*="nav"], header, [class*="header"], [class*="drawer"]',\n            )`;
content = content.replace(pupTarget, pupRepl);

// Wait, Prettier reformatted server.ts, let's use a simpler regex!
content = content.replace(/'nav, aside, \[class\*="sidebar"\], \[class\*="menu"\], \[class\*="nav"\], header, \[class\*="header"\], \[class\*="history"\], \[class\*="drawer"\]'/g, 
  `'nav, aside, [class*="sidebar"], [class*="menu"], [class*="nav"], header, [class*="header"], [class*="drawer"]'`);


// Fix Cheerio deduplication logic
const cheerioDedupTarget = `  // Deduplicate adjacent messages with the exact same content
  const deduplicatedMessages = messages.filter((msg, idx) => {
    if (idx === 0) return true;
    const prevMsg = messages[idx - 1];
    return msg.content !== prevMsg.content;
  });`;

const cheerioDedupRepl = `  // Deduplicate adjacent messages with the exact same content
  const deduplicatedMessages = messages.filter((msg, idx) => {
    if (idx === 0) return true;
    const prevMsg = messages[idx - 1];
    return msg.content.trim() !== prevMsg.content.trim() || msg.role !== prevMsg.role;
  });`;

content = content.replace(cheerioDedupTarget, cheerioDedupRepl);

fs.writeFileSync('server.ts', content);
