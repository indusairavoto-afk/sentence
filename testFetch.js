import https from 'https';

https.get('https://chatgpt.com/share/e/672cbb09-5e04-8010-8b17-062e1e075cd6', (res) => { // fake or outdated link maybe?
  let html = '';
  res.on('data', (d) => { html += d; });
  res.on('end', () => {
    console.log("HTML length:", html.length);
    console.log("Includes remixContext?", html.includes('__remixContext'));
    console.log("Includes INITIAL_STATE?", html.includes('__INITIAL_STATE__'));
  });
});
