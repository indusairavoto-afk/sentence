import fetch from "node-fetch";
import * as fs from "fs";

(async () => {
  const res = await fetch('https://chatgpt.com/share/672eb7d8-eb10-800e-ad6d-e9714fe0edc3', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
  });
  const text = await res.text();
  fs.writeFileSync('chatgpt-dump.html', text);
  console.log("Dumped");
})();
