const fs = require('fs');
const cheerio = require('cheerio');

// Let's print out what logic we actually use inside server.ts's fallback
const html = `
<div class="user-select-none">
   <div class="font-user-message">User text</div>
</div>
<div class="user-select-none">
   <div class="font-claude-message">Claude text</div>
</div>
`;

const $ = cheerio.load(html);

let messageNodes = $('.markdown, [data-message-author-role], .font-claude-message, .font-user-message, .message, .chat-message, [data-testid="message"], div[class*="message"], article');

console.log("matched nodes:", messageNodes.length);
let isUser = true;

const topLevelNodes = [];
messageNodes.each((_, el) => {
   let parent = el.parent;
   let isNested = false;
   while (parent && parent.type !== 'root') {
      const $parent = $(parent);
      if ($parent.is('.markdown, [data-message-author-role], .font-claude-message, .font-user-message, .message, .chat-message, [data-testid="message"], div[class*="message"], article')) {
         isNested = true;
         break;
      }
      parent = parent.parent;
   }
   if (!isNested) topLevelNodes.push(el);
});

console.log("top level nodes:", topLevelNodes.length);

$(topLevelNodes).each((_, el) => {
   const $el = $(el);
   let role = $el.attr('data-message-author-role');
   if (!role) {
      const className = ($el.attr('class') || '').toLowerCase();
      const testId = ($el.attr('data-testid') || '').toLowerCase();
      const isUserClass = /(^|\s|-|_)(user|human|message-in)(\s|-|_|$)/i;
      const isAssistantClass = /(^|\s|-|_)(assistant|bot|ai|claude|message-out)(\s|-|_|$)/i;
      const cleanClassName = className.replace(/user-select/g, '').replace(/select-none/g, '');

      if (cleanClassName.includes('font-user-message') || testId.includes('user') || cleanClassName.match(isUserClass)) {
         role = 'user';
      } else if (cleanClassName.includes('font-claude-message') || testId.includes('assistant') || cleanClassName.match(isAssistantClass)) {
         role = 'assistant';
      } else {
         role = isUser ? 'user' : 'assistant';
      }
   }
   
   console.log("Role decided:", role, "for HTML:", $el.html());
});
