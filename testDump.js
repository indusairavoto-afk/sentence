import fs from 'fs';
const html = fs.readFileSync('page_dump.html', 'utf8');
const classMatch = html.match(/class="[^"]*message[^"]*"/g);
console.log("Classes with 'message':", classMatch ? classMatch.slice(0, 5) : 'None');

const classMatch2 = html.match(/class="[^"]*user[^"]*"/g);
console.log("Classes with 'user':", classMatch2 ? classMatch2.slice(0, 5) : 'None');

// Let's find any text containing 'I am building a tool'
const searchStr = 'problem parsing the tool call'; // Wait, let's search for "Euphoria" or "By messaging ChatGPT" or something from the share link
const euphoria = html.indexOf('Euphoria');
console.log("Euphoria index:", euphoria);

// Search for any json strings
const jsonMatch = html.match(/{"(?:role|author|parts)":.*}/g);
console.log("JSON matches:", jsonMatch ? jsonMatch.length : 'None');

// Search for anything looking like Next.js data
console.log("NEXT_DATA:", html.includes('__NEXT_DATA__'));

// Check for script tags length
const scripts = html.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || [];
console.log("Script tags:", scripts.length);
scripts.forEach((s, idx) => {
  if (s.length > 500) console.log(`Script ${idx} length: ${s.length}, text: ${s.substring(0, 80)}...`);
});
