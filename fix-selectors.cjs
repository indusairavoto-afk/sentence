const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const badSelector = '.markdown, [data-message-author-role], .font-claude-message, .font-user-message, .message, .chat-message, [data-testid="message"], div[class*="message"], article, .prose, .ProseMirror, [class*="prose"], user-query, model-response, [class*="user-query"], [class*="model-response"]';

const goodSelector = '.markdown, [data-message-author-role], .font-claude-message, .font-user-message, .message, .chat-message, [data-testid="message"], article, .prose, .ProseMirror, user-query, model-response, .model-response, .user-query';

content = content.split(badSelector).join(goodSelector);

// There is also the puppeteer one which might differ in whitespace or quotes.
// Let's use a regex that matches the start and end tokens of that large selector string
content = content.replace(/'\[data-message-author-role\], article, \[data-testid\^="conversation-turn"\].*?'/g, "'" + goodSelector + "'");

fs.writeFileSync('server.ts', content);
