const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');

const target1 = `            const isUserClass = /(^|\\s|-|_)(user|human)(\\s|-|_|$)/i;
            const isAssistantClass = /(^|\\s|-|_)(assistant|bot|ai|claude)(\\s|-|_|$)/i;
            const cleanClassName = cls.replace(/user-select/g, '').replace(/select-none/g, '');

            if (cleanClassName.includes('font-user-message') || testId.includes('user') || cleanClassName.match(isUserClass)) {
                role = 'user';
            } else if (cleanClassName.includes('font-claude-message') || testId.includes('assistant') || cleanClassName.match(isAssistantClass)) {
                role = 'assistant';
            } else {
                role = null;
            }`;

const replacement1 = `            const isUserClass = /(^|\\s|-|_)(user|human)(\\s|-|_|$)/i;
            const isAssistantClass = /(^|\\s|-|_)(assistant|bot|ai|claude)(\\s|-|_|$)/i;
            const cleanClassName = cls.replace(/user-select/g, '').replace(/select-none/g, '');

            // Also check children if top level fails to be explicit
            const hasUserChild = el.querySelector('[class*="user-message"], [class*="human"], [data-message-author-role="user"]');
            const hasAssistantChild = el.querySelector('[class*="claude-message"], [class*="assistant"], [class*="bot"], [data-message-author-role="assistant"]');

            if (cleanClassName.includes('font-user-message') || testId.includes('user') || cleanClassName.match(isUserClass) || hasUserChild) {
                role = 'user';
            } else if (cleanClassName.includes('font-claude-message') || testId.includes('assistant') || cleanClassName.match(isAssistantClass) || hasAssistantChild) {
                role = 'assistant';
            } else {
                role = null;
            }`;

if (content.includes(target1)) {
    fs.writeFileSync('server.ts', content.replace(target1, replacement1));
    console.log("Replaced 1");
} else {
    console.log("Target 1 not found");
}

const target2 = `              const isUserClass = /(^|\\s|-|_)(user|human|message-in)(\\s|-|_|$)/i;
              const isAssistantClass = /(^|\\s|-|_)(assistant|bot|ai|claude|message-out)(\\s|-|_|$)/i;
              const cleanClassName = className.replace(/user-select/g, '').replace(/select-none/g, '');

              if (cleanClassName.includes('font-user-message') || testId.includes('user') || cleanClassName.match(isUserClass)) {
                  role = 'user';
              } else if (cleanClassName.includes('font-claude-message') || testId.includes('assistant') || cleanClassName.match(isAssistantClass)) {
                  role = 'assistant';
              } else {
                  role = isUser ? 'user' : 'assistant'; // fallback to flip-flop
              }`;

const replacement2 = `              const isUserClass = /(^|\\s|-|_)(user|human|message-in)(\\s|-|_|$)/i;
              const isAssistantClass = /(^|\\s|-|_)(assistant|bot|ai|claude|message-out)(\\s|-|_|$)/i;
              const cleanClassName = className.replace(/user-select/g, '').replace(/select-none/g, '');

              // Check inner HTML or children if class doesn't help
              const innerHtml = $el.html() || '';
              const hasUserChild = innerHtml.includes('font-user-message') || innerHtml.includes('data-message-author-role="user"');
              const hasAssistantChild = innerHtml.includes('font-claude-message') || innerHtml.includes('data-message-author-role="assistant"');

              if (cleanClassName.includes('font-user-message') || testId.includes('user') || cleanClassName.match(isUserClass) || hasUserChild) {
                  role = 'user';
              } else if (cleanClassName.includes('font-claude-message') || testId.includes('assistant') || cleanClassName.match(isAssistantClass) || hasAssistantChild) {
                  role = 'assistant';
              } else {
                  role = isUser ? 'user' : 'assistant'; // fallback to flip-flop
              }`;

if (content.includes(target2)) {
    fs.writeFileSync('server.ts', fs.readFileSync('server.ts', 'utf8').replace(target2, replacement2));
    console.log("Replaced 2");
} else {
    console.log("Target 2 not found");
}
