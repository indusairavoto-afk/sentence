const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Update Cheerio role extraction
const cheerioFind = `      const isAssistantClass = /(^|\\s|-|_)(assistant|bot|ai|claude|prose|ProseMirror|message-out|model|model-response|gemini|chatgpt)(\\s|-|_|$)/i;`;
const cheerioRepl = `      const isAssistantClass = /(^|\\s|-|_)(assistant|bot|ai|claude|prose|ProseMirror|message-out|model|model-response|gemini|chatgpt|response-container|message-content)(\\s|-|_|$)/i;`;
content = content.replace(cheerioFind, cheerioRepl);

const cheerioHasAssistantFind = `        const hasAssistantChild =
          innerHtml.includes("font-claude-message") ||
          innerHtml.includes('data-message-author-role="assistant"') ||
          innerHtml.includes("model-response") ||
          innerHtml.includes("response-content");`;
const cheerioHasAssistantRepl = `        const hasAssistantChild =
          innerHtml.includes("font-claude-message") ||
          innerHtml.includes('data-message-author-role="assistant"') ||
          innerHtml.includes("model-response") ||
          innerHtml.includes("response-container") ||
          innerHtml.includes("message-content") ||
          innerHtml.includes("response-content");`;
content = content.replace(cheerioHasAssistantFind, cheerioHasAssistantRepl);

const cheerioTagNameFind = `        } else if (
          cleanClassName.includes("font-claude-message") ||
          testId.includes("assistant") ||
          cleanClassName.match(isAssistantClass) ||
          hasAssistantChild ||
          tagName.includes("model-response")
        ) {`;
const cheerioTagNameRepl = `        } else if (
          cleanClassName.includes("font-claude-message") ||
          testId.includes("assistant") ||
          cleanClassName.match(isAssistantClass) ||
          hasAssistantChild ||
          tagName.includes("model-response") ||
          tagName.includes("response-container") ||
          tagName.includes("message-content")
        ) {`;
content = content.replace(cheerioTagNameFind, cheerioTagNameRepl);

// Update Puppeteer role extraction
const pupIsAssistantFind = `              const isAssistantClass = /(^|\\s|-|_)(assistant|bot|ai|claude|prose|ProseMirror|message-out|model|model-response|gemini|chatgpt)(\\s|-|_|$)/i;`;
const pupIsAssistantRepl = `              const isAssistantClass = /(^|\\s|-|_)(assistant|bot|ai|claude|prose|ProseMirror|message-out|model|model-response|gemini|chatgpt|response-container|message-content)(\\s|-|_|$)/i;`;
content = content.replace(pupIsAssistantFind, pupIsAssistantRepl);

const pupHasAssistantFind = `              const hasAssistantChild = el.querySelector(
                '[class*="claude-message"], [class*="assistant"], [class*="bot"], [data-message-author-role="assistant"], model-response, [class*="model-response"]',
              );`;
const pupHasAssistantRepl = `              const hasAssistantChild = el.querySelector(
                '[class*="claude-message"], [class*="assistant"], [class*="bot"], [data-message-author-role="assistant"], model-response, response-container, message-content, [class*="model-response"], [class*="response-container"]',
              );`;
content = content.replace(pupHasAssistantFind, pupHasAssistantRepl);

const pupTagNameFind = `              } else if (
                cleanClassName.includes("font-claude-message") ||
                testId.includes("assistant") ||
                cleanClassName.match(isAssistantClass) ||
                hasAssistantChild ||
                tagName.includes("model-response")
              ) {`;
const pupTagNameRepl = `              } else if (
                cleanClassName.includes("font-claude-message") ||
                testId.includes("assistant") ||
                cleanClassName.match(isAssistantClass) ||
                hasAssistantChild ||
                tagName.includes("model-response") ||
                tagName.includes("response-container") ||
                tagName.includes("message-content")
              ) {`;
content = content.replace(pupTagNameFind, pupTagNameRepl);

fs.writeFileSync('server.ts', content);
