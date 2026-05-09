const fs = require('fs');
let text = fs.readFileSync('server.ts', 'utf8');

const regex = /const className \= \(\$el\.attr\('class'\) \|\| ''\)\.toLowerCase\(\);\s+const testId \= \(\$el\.attr\('data-testid'\) \|\| ''\)\.toLowerCase\(\);(?:.|\n)*?else role = isUser \? 'user' : 'assistant'; \/\/ fallback to flip-flop\n\s+\}/i;

const replacement = `const className = ($el.attr('class') || '').toLowerCase();
              const testId = ($el.attr('data-testid') || '').toLowerCase();
              const isUserClass = /(^|\\s|-|_)(user|human|message-in)(\\s|-|_|$)/i;
              const isAssistantClass = /(^|\\s|-|_)(assistant|bot|ai|claude|message-out)(\\s|-|_|$)/i;
              const cleanClassName = className.replace(/user-select/g, '').replace(/select-none/g, '');

              if (cleanClassName.includes('font-user-message') || testId.includes('user') || cleanClassName.match(isUserClass)) {
                  role = 'user';
              } else if (cleanClassName.includes('font-claude-message') || testId.includes('assistant') || cleanClassName.match(isAssistantClass)) {
                  role = 'assistant';
              } else {
                  role = isUser ? 'user' : 'assistant'; // fallback to flip-flop
              }`;

text = text.replace(regex, replacement);
fs.writeFileSync('server.ts', text);
