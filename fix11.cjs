const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const s1 = `[class*="message"], .message, .chat-message, [data-test-id="message"]`;
const r1 = `[class*="message"], .message, .chat-message, [data-test-id="message"], .markdown, [data-is-streaming]`;

content = content.replace(s1, r1);
content = content.replace(s1, r1);

fs.writeFileSync('server.ts', content);
