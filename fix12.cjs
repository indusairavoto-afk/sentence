const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// 1. Selector replacements
const s1 = `[class*="message"], .message, .chat-message, [data-test-id="message"], .markdown, [data-is-streaming], .markdown, [data-is-streaming]`;
const r1 = `[class*="message"], .message, .chat-message, [data-test-id="message"], .markdown, [data-is-streaming], user-query, model-response, [class*="user-query"], [class*="model-response"]`;

content = content.split(s1).join(r1);

// 2. Class regex
const userClassRegex = `const isUserClass = /(^|\\s|-|_)(user|human|message-in)(\\s|-|_|$)/i;`;
const userClassRegexRepl = `const isUserClass = /(^|\\s|-|_)(user|human|message-in|query|user-query)(\\s|-|_|$)/i;`;
content = content.split(userClassRegex).join(userClassRegexRepl);

const userClassRegex2 = `const isUserClass = /(^|\\s|-|_)(user|human)(\\s|-|_|$)/i;`; // For the first one
content = content.split(userClassRegex2).join(userClassRegexRepl);

const asstClassRegex = `const isAssistantClass = /(^|\\s|-|_)(assistant|bot|ai|claude|prose|ProseMirror|message-out)(\\s|-|_|$)/i;`;
const asstClassRegexRepl = `const isAssistantClass = /(^|\\s|-|_)(assistant|bot|ai|claude|prose|ProseMirror|message-out|model|model-response|gemini|chatgpt)(\\s|-|_|$)/i;`;
content = content.split(asstClassRegex).join(asstClassRegexRepl);

// Wait, the first asst class might be slightly different. Let's do a replace
content = content.replace(/const isAssistantClass = \/.*\//g, asstClassRegexRepl);

// 3. Child HTML checks
const childUserTarget1 = `const hasUserChild = innerHtml.includes('font-user-message') || innerHtml.includes('data-message-author-role="user"');`;
const childUserRepl1   = `const hasUserChild = innerHtml.includes('font-user-message') || innerHtml.includes('data-message-author-role="user"') || innerHtml.includes('user-query');`;

const childAsstTarget1 = `const hasAssistantChild = innerHtml.includes('font-claude-message') || innerHtml.includes('data-message-author-role="assistant"');`;
const childAsstRepl1   = `const hasAssistantChild = innerHtml.includes('font-claude-message') || innerHtml.includes('data-message-author-role="assistant"') || innerHtml.includes('model-response') || innerHtml.includes('response-content');`;

content = content.split(childUserTarget1).join(childUserRepl1);
content = content.split(childAsstTarget1).join(childAsstRepl1);

// Also the querySelector checks
const qUserTarget = `const hasUserChild = el.querySelector('[class*="user-message"], [class*="human"], [data-message-author-role="user"]');`;
const qUserRepl = `const hasUserChild = el.querySelector('[class*="user-message"], [class*="human"], [data-message-author-role="user"], user-query, [class*="user-query"]');`;

const qAsstTarget = `const hasAssistantChild = el.querySelector('[class*="claude-message"], [class*="assistant"], [class*="bot"], [data-message-author-role="assistant"]');`;
const qAsstRepl = `const hasAssistantChild = el.querySelector('[class*="claude-message"], [class*="assistant"], [class*="bot"], [data-message-author-role="assistant"], model-response, [class*="model-response"]');`;

content = content.split(qUserTarget).join(qUserRepl);
content = content.split(qAsstTarget).join(qAsstRepl);

// Make sure tagName itself is checked! 
// Let's replace class checks to also consider tagName
const cleanClassNameCheckTarget = `if (cleanClassName.includes('font-user-message') || testId.includes('user') || cleanClassName.match(isUserClass) || hasUserChild) {`;
const cleanClassUserReact = `const tagName = ($el.prop('tagName') || el.tagName || '').toLowerCase();
              if (cleanClassName.includes('font-user-message') || testId.includes('user') || cleanClassName.match(isUserClass) || hasUserChild || tagName.includes('user-query')) {`;

content = content.replace(cleanClassNameCheckTarget, cleanClassUserReact);
content = content.replace(cleanClassNameCheckTarget, cleanClassUserReact);

const cleanClassNameAsstCheckTarget = `} else if (cleanClassName.includes('font-claude-message') || testId.includes('assistant') || cleanClassName.match(isAssistantClass) || hasAssistantChild) {`;
const cleanClassAsstReact = `} else if (cleanClassName.includes('font-claude-message') || testId.includes('assistant') || cleanClassName.match(isAssistantClass) || hasAssistantChild || tagName.includes('model-response')) {`;

content = content.replace(cleanClassNameAsstCheckTarget, cleanClassAsstReact);
content = content.replace(cleanClassNameAsstCheckTarget, cleanClassAsstReact);

fs.writeFileSync('server.ts', content);
