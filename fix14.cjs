const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Puppeteer side
const pupSearch = `const topLevelElements = elements.filter(el => {\n         let parent = el.parentElement;`;
const pupReplace = `const topLevelElements = elements.filter(el => {\n         if (el.closest('nav, aside, [class*="sidebar"], [class*="menu"], [class*="nav"], header, [class*="header"], [class*="history"], [class*="drawer"]')) return false;\n         let parent = el.parentElement;`;
content = content.replace(pupSearch, pupReplace);

// Cheerio side
const cheerioSearch = `const topLevelNodes: any[] = [];\n       messageNodes.each((_, el) => {\n          let parent = el.parent;`;
const cheerioReplace = `const topLevelNodes: any[] = [];\n       messageNodes.each((_, el) => {\n          if ($(el).closest('nav, aside, [class*="sidebar"], [class*="menu"], [class*="nav"], header, [class*="header"], [class*="history"], [class*="drawer"]').length > 0) return;\n          let parent = el.parent;`;
content = content.replace(cheerioSearch, cheerioReplace);

const fullSelector = `[data-message-author-role], article, [data-testid^="conversation-turn"], .font-claude-message, .font-user-message, .prose, .ProseMirror, [class*="prose"], [class*="message"], .message, .chat-message, [data-test-id="message"], .markdown, [data-is-streaming], user-query, model-response, [class*="user-query"], [class*="model-response"]`;
content = content.replace(/parent\.matches\('[^']+'\)/g, `parent.matches('${fullSelector}')`);
content = content.replace(/\$parent\.is\('[^']+'\)/g, `$parent.is('${fullSelector}')`);

fs.writeFileSync('server.ts', content);
