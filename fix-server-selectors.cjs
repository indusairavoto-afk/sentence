const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// 1. Fix message selection by adding response-container and message-content
const selectorFind = '.markdown, [data-message-author-role], .font-claude-message, .font-user-message, .message, .chat-message, [data-testid="message"], article, .prose, .ProseMirror, user-query, model-response, .model-response, .user-query';
const selectorRepl = '.markdown, [data-message-author-role], .font-claude-message, .font-user-message, .message, .chat-message, [data-testid="message"], article, .prose, .ProseMirror, user-query, model-response, .model-response, .user-query, response-container, message-content';

content = content.split(selectorFind).join(selectorRepl);

// 2. Fix the exclusion filter
const exclFind = 'nav, aside, [class*="sidebar"], [class*="menu"], [class*="nav"], header, [class*="header"], [class*="drawer"]';
const exclRepl = 'nav, aside, [class*="sidebar"], [class*="menu"], header, [class*="header"], [class*="drawer"]';

content = content.split(exclFind).join(exclRepl);

fs.writeFileSync('server.ts', content);
