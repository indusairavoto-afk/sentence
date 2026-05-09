const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const target1 = `          if (!role) {
            // check data-testid for claude
            const testId = el.getAttribute('data-testid');
            if (testId && testId.includes('user')) role = 'user';
            else if (testId && testId.includes('assistant')) role = 'assistant';
            else if (el.closest('[class*="user"]')) role = 'user';
            else if (el.closest('[class*="assistant"]')) role = 'assistant';
            else {
              const text = (el as HTMLElement).innerText || el.textContent || '';
              const textLower = text.toLowerCase().substring(0, 50);
              if (textLower.includes('user')) role = 'user';
              else if (textLower.includes('assistant') || textLower.includes('chatgpt')) role = 'assistant';
              else role = null; // fallback will be applied later
            }
          }`;

const replacement1 = `          if (!role) {
            const testId = (el.getAttribute('data-testid') || '').toLowerCase();
            const cls = (el.className && typeof el.className === 'string') ? el.className.toLowerCase() : '';
            const isUserClass = /(^|\\s|-|_)(user|human)(\\s|-|_|$)/i;
            const isAssistantClass = /(^|\\s|-|_)(assistant|bot|ai|claude)(\\s|-|_|$)/i;
            const cleanClassName = cls.replace(/user-select/g, '').replace(/select-none/g, '');

            if (cleanClassName.includes('font-user-message') || testId.includes('user') || cleanClassName.match(isUserClass)) {
                role = 'user';
            } else if (cleanClassName.includes('font-claude-message') || testId.includes('assistant') || cleanClassName.match(isAssistantClass)) {
                role = 'assistant';
            } else {
                role = null;
            }
          }`;

const target2 = `            if (!role) {
              const className = ($el.attr('class') || '').toLowerCase();
              const testId = ($el.attr('data-testid') || '').toLowerCase();
              if (className.includes('user') || className.includes('human') || testId.includes('user')) role = 'user';
              else if (className.includes('assistant') || className.includes('bot') || className.includes('ai') || testId.includes('assistant')) role = 'assistant';
              else {
                const textLower = $el.text().toLowerCase().substring(0, 50);
                if (textLower.includes('user')) role = 'user';
                else if (textLower.includes('assistant') || textLower.includes('chatgpt')) role = 'assistant';
                else role = isUser ? 'user' : 'assistant'; // fallback to flip-flop
              }
            }`;

const replacement2 = `            if (!role) {
              const className = ($el.attr('class') || '').toLowerCase();
              const testId = ($el.attr('data-testid') || '').toLowerCase();
              const isUserClass = /(^|\\s|-|_)(user|human)(\\s|-|_|$)/i;
              const isAssistantClass = /(^|\\s|-|_)(assistant|bot|ai|claude)(\\s|-|_|$)/i;
              const cleanClassName = className.replace(/user-select/g, '').replace(/select-none/g, '');

              if (cleanClassName.includes('font-user-message') || testId.includes('user') || cleanClassName.match(isUserClass)) {
                  role = 'user';
              } else if (cleanClassName.includes('font-claude-message') || testId.includes('assistant') || cleanClassName.match(isAssistantClass)) {
                  role = 'assistant';
              } else {
                  role = isUser ? 'user' : 'assistant'; // fallback to flip-flop
              }
            }`;

const stripSpace = s => s.replace(/\\s+/g, '');

if (stripSpace(content).includes(stripSpace(target1))) {
    const pattern = target1.replace(/[.*+?^$\\{}()|[\\]\\\\]/g, '\\\\$&').replace(/\\s+/g, '\\\\s+');
    const re = new RegExp(pattern);
    content = content.replace(re, replacement1);
    console.log("Replaced target 1");
}

if (stripSpace(content).includes(stripSpace(target2))) {
    const pattern2 = target2.replace(/[.*+?^$\\{}()|[\\]\\\\]/g, '\\\\$&').replace(/\\s+/g, '\\\\s+');
    const re2 = new RegExp(pattern2);
    content = content.replace(re2, replacement2);
    console.log("Replaced target 2");
}

fs.writeFileSync('server.ts', content);
