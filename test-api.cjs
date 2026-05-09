const fs = require('fs');

(async () => {
    const html = fs.readFileSync('gemini_dump_3.html', 'utf8');
    const res = await fetch('http://localhost:3000/api/extract-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, filename: 'gemini.html' })
    });
    const data = await res.json();
    console.log("Response status:", res.status);
    console.log("Extracted messages length:", data.messages ? data.messages.length : data.error);
    if (data.messages && data.messages.length > 0) {
        data.messages.forEach((m, i) => {
            console.log("[" + i + "] Role: " + m.role);
            console.log(m.content.substring(0, 80));
            console.log('---');
        });
    }
})();
