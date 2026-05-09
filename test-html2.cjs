const fs = require('fs');
const cheerio = require('cheerio');

const html = `
<div class="message">
   <div class="font-user-message">User text</div>
</div>
<div class="message">
   <div class="font-claude-message">Claude text</div>
</div>
`;

const $ = cheerio.load(html);

let messageNodes = $('.markdown, [data-message-author-role], .font-claude-message, .font-user-message, .message, .chat-message, [data-testid="message"], div[class*="message"], article');

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

let isUser = true;

$(topLevelNodes).each((_, el) => {
   const $el = $(el);
   let role = undefined;
   
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

   console.log("Role decided:", role);
   
   if (role === 'assistant') {
       isUser = true;
     } else if (role === 'user') {
       isUser = false;
     } else {
       isUser = !isUser; 
     }
});
