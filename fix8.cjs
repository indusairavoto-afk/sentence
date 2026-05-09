const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// 1. Add .prose and .ProseMirror to Puppeteer $$eval
const evalTarget = `const messagesData = await page.$$eval('[data-message-author-role], article, [data-testid^="conversation-turn"], .font-claude-message, .font-user-message', (elements) => {`;
const evalRepl = `const messagesData = await page.$$eval('[data-message-author-role], article, [data-testid^="conversation-turn"], .font-claude-message, .font-user-message, .prose, .ProseMirror, [class*="prose"]', (elements) => {`;

content = content.replace(evalTarget, evalRepl);

// 2. Add .prose and .ProseMirror to puppeteer nested check
const nestedTarget = `if (parent.matches('[data-message-author-role], article, [data-testid^="conversation-turn"], .font-claude-message, .font-user-message')) {`;
const nestedRepl = `if (parent.matches('[data-message-author-role], article, [data-testid^="conversation-turn"], .font-claude-message, .font-user-message, .prose, .ProseMirror, [class*="prose"]')) {`;

content = content.replace(nestedTarget, nestedRepl);

// 3. Add to fallback messageNodes selector
const fallbackTarget = `let messageNodes = $('.markdown, [data-message-author-role], .font-claude-message, .font-user-message, .message, .chat-message, [data-testid="message"], div[class*="message"], article');`;
const fallbackRepl = `let messageNodes = $('.markdown, [data-message-author-role], .font-claude-message, .font-user-message, .message, .chat-message, [data-testid="message"], div[class*="message"], article, .prose, .ProseMirror, [class*="prose"]');`;

content = content.replace(fallbackTarget, fallbackRepl);

// 4. Add to fallback nested check
const fallbackNestedTarget = `if ($parent.is('.markdown, [data-message-author-role], .font-claude-message, .font-user-message, .message, .chat-message, [data-testid="message"], div[class*="message"], article')) {`;
const fallbackNestedRepl = `if ($parent.is('.markdown, [data-message-author-role], .font-claude-message, .font-user-message, .message, .chat-message, [data-testid="message"], div[class*="message"], article, .prose, .ProseMirror, [class*="prose"]')) {`;

content = content.replace(fallbackNestedTarget, fallbackNestedRepl);

// 5. Add prose to assistant regex in BOTH places
// There are two identical regexes to replace:
const regexTarget1 = `const isAssistantClass = /(^|\\s|-|_)(assistant|bot|ai|claude)(\\s|-|_|$)/i;`;
const regexRepl1 = `const isAssistantClass = /(^|\\s|-|_)(assistant|bot|ai|claude|prose|message-out)(\\s|-|_|$)/i;`;

content = content.replace(regexTarget1, regexRepl1);

const regexTarget2 = `const isAssistantClass = /(^|\\s|-|_)(assistant|bot|ai|claude|message-out)(\\s|-|_|$)/i;`;
const regexRepl2 = `const isAssistantClass = /(^|\\s|-|_)(assistant|bot|ai|claude|prose|ProseMirror|message-out)(\\s|-|_|$)/i;`;

// Notice regexRepl2 is used for the second one, but in the Puppeteer evaluator it's the first one. Let's just global replace them to be safe.
content = content.replace(/const isAssistantClass = \/\(\^\|\\\\s\|-\|_|\\s\)\(assistant\|bot\|ai\|claude\|message-out\)\(\\\\s\|-\|_\|\$\)\/i;/g, regexRepl2);
content = content.replace(/const isAssistantClass = \/\(\^\|\\\\s\|-\|_\)\(assistant\|bot\|ai\|claude\)\(\\\\s\|-\|_\|\$\)\/i;/g, regexRepl2);

fs.writeFileSync('server.ts', content);
