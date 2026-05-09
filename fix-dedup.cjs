const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const cheerioDedupPattern = `  // Deduplicate consecutive messages from the same role if their text is highly similar or included
  const deduplicatedMessages = [];
  for (const msg of messages) {
    if (deduplicatedMessages.length === 0) {
      deduplicatedMessages.push(msg);
      continue;
    }
    const prevMsg = deduplicatedMessages[deduplicatedMessages.length - 1];
    if (prevMsg.role === msg.role) {
       const prevText = prevMsg.content.trim();
       const currText = msg.content.trim();
       if (prevText === currText || prevText.includes(currText) || currText.includes(prevText)) {
          // Keep the longer one as it usually has the full text
          if (currText.length > prevText.length) {
             prevMsg.content = msg.content;
             if (msg.imagesUrls && msg.imagesUrls.length > 0) {
                 prevMsg.imagesUrls = [...new Set([...(prevMsg.imagesUrls || []), ...msg.imagesUrls])];
             }
          }
          continue;
       }
    }
    deduplicatedMessages.push(msg);
  }`;

const cheerioDedupFix = `  // Deduplicate adjacent messages with the exact same content
  const deduplicatedMessages = messages.filter((msg, idx) => {
    if (idx === 0) return true;
    const prevMsg = messages[idx - 1];
    return msg.content.trim() !== prevMsg.content.trim() || msg.role !== prevMsg.role;
  });`;

content = content.replace(cheerioDedupPattern, cheerioDedupFix);

// Puppeteer target
const pupDedupPattern = `    console.log('Puppeteer Extracted messages length:', messages.length);
    // Deduplicate perfectly adjacent identical texts
    const deduplicatedMessages = [];
    for (const msg of messages) {
      if (deduplicatedMessages.length === 0) {
        deduplicatedMessages.push(msg);
        continue;
      }
      const prevMsg = deduplicatedMessages[deduplicatedMessages.length - 1];
      if (prevMsg.role === msg.role) {
         const prevText = prevMsg.text.trim();
         const currText = msg.text.trim();
         if (prevText === currText || prevText.includes(currText) || currText.includes(prevText)) {
            if (currText.length > prevText.length) {
               prevMsg.text = msg.text;
               if (msg.imagesUrls && msg.imagesUrls.length > 0) {
                 prevMsg.imagesUrls = [...new Set([...(prevMsg.imagesUrls || []), ...msg.imagesUrls])];
               }
            }
            continue;
         }
      }
      deduplicatedMessages.push(msg);
    }`;

const pupDedupFix = `    // Deduplicate perfectly adjacent identical texts
    const deduplicatedMessages = messages.filter((msg, idx) => {
      if (idx === 0) return true;
      const prevMsg = messages[idx - 1];
      return msg.text.trim() !== prevMsg.text.trim() || msg.role !== prevMsg.role;
    });`;

if(content.includes('Puppeteer Extracted messages length:')) {
    content = content.replace(pupDedupPattern, pupDedupFix);
}

fs.writeFileSync('server.ts', content);
