const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const puppeteerSelectorFind = `'[data-message-author-role], article, [data-testid^="conversation-turn"], .font-claude-message, .font-user-message, .prose, .ProseMirror, [class*="prose"]'`;

const puppeteerSelectorReplace = `'[data-message-author-role], article, [data-testid^="conversation-turn"], .font-claude-message, .font-user-message, .prose, .ProseMirror, [class*="prose"], [class*="message"], .message, .chat-message, [data-test-id="message"]'`;

content = content.replace(puppeteerSelectorFind, puppeteerSelectorReplace);
content = content.replace(puppeteerSelectorFind, puppeteerSelectorReplace);

fs.writeFileSync('server.ts', content);
