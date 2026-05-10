const fs = require('fs');
const fetch = require('node-fetch').default || require('node-fetch');

(async () => {
    const html = `
    <html><body>
        <main>
        <div class="message"><p>Hello!</p></div>
        <div class="message"><p>Hi there!</p></div>
        <div class="message"><p>How are you?</p></div>
        </main>
    </body></html>
    `;
    const res = await fetch('http://localhost:3000/api/extract-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html })
    });
    console.log(await res.text());
})();
