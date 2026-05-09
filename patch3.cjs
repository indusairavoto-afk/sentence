const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Pup replace
content = content.replace(/t = t\.replace\(\/Uploaded an image\\\\s\*Uploaded an image\/gi, "Uploaded an image"\);/, 't = t.replace(/Uploaded an image/gi, "");');

// Cheerio replace
content = content.replace(/content = content\.replace\(\/Uploaded an image\\\\s\*Uploaded an image\/gi, "Uploaded an image"\);/, 'content = content.replace(/Uploaded an image/gi, "");');

// Re-write
fs.writeFileSync('server.ts', content);
