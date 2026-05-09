const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Pup role extraction
const pupFallbackFind = `              } else {
                role = null;
              }`;
const pupFallbackRepl = `              } else {
                const textContent = (el as HTMLElement).innerText || el.textContent || "";
                if (textContent.match(/^\\s*(You said|You|User):?/i)) {
                  role = "user";
                } else if (textContent.match(/^\\s*(ChatGPT|Claude|Gemini|Assistant|Grok|Bot|AI)( said)?:?/i)) {
                  role = "assistant";
                } else {
                  role = null;
                }
              }`;
content = content.replace(pupFallbackFind, pupFallbackRepl);

// Cheerio role extraction
const cheeFallbackFind = `          } else {
            role = isUser ? "user" : "assistant"; // fallback to flip-flop
          }`;
const cheeFallbackRepl = `          } else {
            const textContent = $el.text() || "";
            if (textContent.match(/^\\s*(You said|You|User):?/i)) {
              role = "user";
            } else if (textContent.match(/^\\s*(ChatGPT|Claude|Gemini|Assistant|Grok|Bot|AI)( said)?:?/i)) {
              role = "assistant";
            } else {
              role = isUser ? "user" : "assistant"; // fallback to flip-flop
            }
          }`;
content = content.replace(cheeFallbackFind, cheeFallbackRepl);

fs.writeFileSync('server.ts', content);
