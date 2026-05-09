const fs = require('fs');
const cheerio = require('cheerio');

const html = `<!DOCTYPE html><html><body><main><div class="message-row"><div>User: suno meri baat</div></div><div class="message-row"><div>Grok: Haan bilkul</div></div></main></body></html>`;

const $ = cheerio.load(html);
let messageNodes = $(
      '.markdown, [data-message-author-role], .font-claude-message, .font-user-message, .message, .chat-message, [data-testid="message"], article, .prose, .ProseMirror, user-query, model-response, .model-response, .user-query, response-container, message-content, .message-row, .message-bubble, [class*="message-row"], [class*="message-bubble"]'
    );
console.log(messageNodes.length);
