import fetch from "node-fetch";

(async () => {
  // Using a random public ChatGPT share link structure
  const res = await fetch('http://localhost:3000/api/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: "https://chatgpt.com/share/672eb7d8-eb10-800e-ad6d-e9714fe0edc3", extractImages: false })
  });
  console.log(res.status);
  const text = await res.text();
  console.log(text.substring(0, 500));
})();
