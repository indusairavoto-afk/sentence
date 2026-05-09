const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const start2 = "const className = ($el.attr('class') || '').toLowerCase();";
const end2 = "              }\n            }";

const repl2 = `const className = ($el.attr('class') || '').toLowerCase();
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
              }
            }`;

let j1 = content.indexOf(start2);
let j2 = content.indexOf(end2, j1);
if (j1 >= 0 && j2 >= 0) {
    content = content.substring(0, j1) + repl2 + content.substring(j2 + end2.length);
    console.log('Replaced target 2');
} else {
    console.log('Failed to find bounds:', j1, j2);
}

fs.writeFileSync('server.ts', content);
