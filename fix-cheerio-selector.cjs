const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const cheerioSelectorTarget = `    let messageNodes = $(
      '.markdown, [data-message-author-role], .font-claude-message, .font-user-message, .message, .chat-message, [data-testid="message"], div[class*="message"], article, .prose, .ProseMirror, [class*="prose"]',
    );`;

const cheerioSelectorRepl = `    let messageNodes = $(
      '.markdown, [data-message-author-role], .font-claude-message, .font-user-message, .message, .chat-message, [data-testid="message"], div[class*="message"], article, .prose, .ProseMirror, [class*="prose"], user-query, model-response, [class*="user-query"], [class*="model-response"]',
    );`;

content = content.replace(cheerioSelectorTarget, cheerioSelectorRepl);

// Wait, the formatting in server.ts might be slightly different.
// Let's use a simpler regex!
content = content.replace(/'.markdown, \[data-message-author-role\], .font-claude-message, .font-user-message, .message, .chat-message, \[data-testid="message"\], div\[class\*="message"\], article, .prose, .ProseMirror, \[class\*="prose"\]'/g, 
  `'.markdown, [data-message-author-role], .font-claude-message, .font-user-message, .message, .chat-message, [data-testid="message"], div[class*="message"], article, .prose, .ProseMirror, [class*="prose"], user-query, model-response, [class*="user-query"], [class*="model-response"]'`);

fs.writeFileSync('server.ts', content);
