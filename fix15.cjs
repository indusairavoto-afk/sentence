const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const target = `    const title = await page.title() || 'Extracted Chat';
    return { title, messages };`;

const replacement = `    // Deduplicate perfectly adjacent identical texts
    const deduplicatedMessages = messages.filter((msg, idx) => {
      if (idx === 0) return true;
      const prevMsg = messages[idx - 1];
      return msg.text.trim() !== prevMsg.text.trim() || msg.role !== prevMsg.role;
    });

    const title = await page.title() || 'Extracted Chat';
    return { title, messages: deduplicatedMessages };`;

content = content.replace(target, replacement);
fs.writeFileSync('server.ts', content);
