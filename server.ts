import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import * as cheerio from "cheerio";
import { convert } from "html-to-text";
import crypto from "crypto";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

const app = express();
let debugLogs = [];
const origLog = console.log;
console.log = function(...args) { debugLogs.push(args.join(' ')); origLog(...args); };
const origErr = console.error;
console.error = function(...args) { debugLogs.push('ERR: ' + args.join(' ')); origErr(...args); };
app.get('/api/debug-logs', (req, res) => res.json(debugLogs));
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Setup storage for images
const storageDir = path.join(process.cwd(), "storage", "images");
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}
app.use("/images", express.static(storageDir));

// Generates a public text link readable by external AI bots (like Claude)
app.post("/api/public-bridge", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text content is required" });
    }

    // We use dpaste.com to generate a temporary public URL that bots can scrape without auth walls
    const response = await fetch("https://dpaste.com/api/v2/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        content: text,
        format: "url",
        syntax: "md",
        expiry_days: "1",
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`Public link generation failed: ${response.status}`);
    }

    const url = (await response.text()).trim();
    // Add .txt extension to ensure AI scrapers get the raw text directly
    res.json({ url: url + ".txt" });
  } catch (error: any) {
    console.error("Bridge error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Helper to parse ChatGPT/AI share links and download local images
async function extractChatWithImages(
  url: string,
  extractImages: boolean = true,
) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    // Handle Cloudflare or other "Just a moment..." interstitials
    let title = await page.title();
    if (title.toLowerCase().includes("just a moment") || title.toLowerCase().includes("cloudflare")) {
       console.log("Cloudflare detected, waiting for challenge to solve...");
       try {
         await page.waitForFunction(
           () => !document.title.toLowerCase().includes("just a moment") && !document.title.toLowerCase().includes("cloudflare"),
           { timeout: 30000 }
         );
       } catch (e) {
         console.log("Timeout waiting for Cloudflare challenge to complete.");
       }
    }

    // Handle Cloudflare by moving mouse randomly
    console.log("Simulating mouse movements just in case...");
    await page.mouse.move(100, 100);
    await page.mouse.down();
    await page.mouse.move(200, 200);
    await page.mouse.up();
    await new Promise((r) => setTimeout(r, 1000));
    await page.mouse.move(300, 300);

    let finalTitle = await page.title();
    if (finalTitle.toLowerCase().includes("just a moment") || finalTitle.toLowerCase().includes("cloudflare")) {
      throw new Error("CLOUDFLARE_BLOCKED");
    }

    // Wait until chat messages are fully rendered in the DOM
    console.log(`Waiting for chat elements...`);
    try {
      await page.waitForSelector(
        '.markdown, [data-message-author-role], .font-claude-message, .font-user-message, .message, .chat-message, [data-testid="message"], article, .prose, .ProseMirror, user-query, model-response, .model-response, .user-query, response-container, message-content, .message-row, .message-bubble',
        { timeout: 30000 },
      );

      // Auto-scroll to load lazy images
      await page.evaluate(async () => {
        await new Promise<void>((resolve) => {
          let totalHeight = 0;
          const distance = 300;
          const timer = setInterval(() => {
            const scrollHeight = document.documentElement.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;
            if (totalHeight >= scrollHeight) {
              clearInterval(timer);
              resolve();
            }
          }, 100);
        });
      });
      // Wait a moment for images to fetch
      await new Promise((r) => setTimeout(r, 2000));
    } catch (timeoutErr) {
      console.log(
        `Timeout waiting for standard selectors. The page might be protected or have a different structure.`,
      );
    }

    // Select all elements that contain messages and extract role/innerText
    const messagesData = await page.$$eval(
      '.markdown, [data-message-author-role], .font-claude-message, .font-user-message, .message, .chat-message, [data-testid="message"], article, .prose, .ProseMirror, user-query, model-response, .model-response, .user-query, response-container, message-content, .message-row, .message-bubble',
      (elements) => {
        // Filter out nested matching elements to avoid duplicate extractions
        const topLevelElements = elements.filter((el) => {
          if (
            el.closest(
              'nav, aside, [class*="sidebar"], [class*="menu"], header, [class*="header"], .drawer, .drawer-content',
            )
          )
            return false;
          let parent = el.parentElement;
          while (parent) {
            if (
              parent.matches(
                '.markdown, [data-message-author-role], .font-claude-message, .font-user-message, .message, .chat-message, [data-testid="message"], article, .prose, .ProseMirror, user-query, model-response, .model-response, .user-query, response-container, message-content, .message-row, .message-bubble',
              )
            ) {
              return false;
            }
            parent = parent.parentElement;
          }
          return true;
        });

        return topLevelElements
          .map((el) => {
            // Try to find a time element nearby
            const timeEl = el
              .closest("div, article, [data-testid]")
              ?.querySelector("time");
            const timestamp = timeEl
              ? timeEl.getAttribute("datetime")
              : undefined;

            const imgs = Array.from(el.querySelectorAll("img"))
              .map((img) => {
                let src = (img as HTMLImageElement).src;
                if (
                  src &&
                  src.includes("_next/image") &&
                  src.includes("url=")
                ) {
                  try {
                    const urlParam = new URL(src).searchParams.get("url");
                    if (urlParam) {
                      // Check if it's already an absolute URL
                      src = urlParam.startsWith("http")
                        ? urlParam
                        : `https://chatgpt.com${urlParam.startsWith("/") ? "" : "/"}${urlParam}`;
                    }
                  } catch (e) {}
                }

                // Check if it's a blob
                if (src.startsWith("blob:")) {
                  // Too complex to async fetch blobs within this sync map, but usually share links don't have blobs.
                }

                return src;
              })
              .filter(
                (src) =>
                  src &&
                  (src.startsWith("http") || src.startsWith("data:image")),
              );

            const canvases = Array.from(el.querySelectorAll("canvas"))
              .map((canvas: any) => {
                try {
                  return canvas.toDataURL("image/png");
                } catch (e) {
                  return null;
                }
              })
              .filter(Boolean);

            const bgImgs = Array.from(
              el.querySelectorAll('[style*="background-image"]'),
            )
              .map((div) => {
                const style = (div as HTMLElement).style.backgroundImage;
                const match = style.match(/url\(["']?(.*?)["']?\)/);
                return match ? match[1] : null;
              })
              .filter(
                (src) =>
                  src &&
                  (src.startsWith("http") || src.startsWith("data:image")),
              );

            const allImgs = [...imgs, ...canvases, ...bgImgs];

            let role = el.getAttribute("data-message-author-role");
            if (!role) {
              // check children for role (sometimes the top level wrapper doesn't have it)
              const childWithRole = el.querySelector(
                "[data-message-author-role]",
              );
              if (childWithRole) {
                role = childWithRole.getAttribute("data-message-author-role");
              }
            }
            if (!role) {
              // check data-testid for claude
              const testId = (
                el.getAttribute("data-testid") || ""
              ).toLowerCase();
              const cls =
                el.className && typeof el.className === "string"
                  ? el.className.toLowerCase()
                  : "";
              const isUserClass =
                /(^|\s|-|_)(user|human|message-in|query|user-query)(\s|-|_|$)/i;
              const isAssistantClass =
                /(^|\s|-|_)(assistant|bot|ai|claude|prose|ProseMirror|message-out|model|model-response|gemini|chatgpt|response-container|message-content|grok)(\s|-|_|$)/i;
              const cleanClassName = cls
                .replace(/user-select/g, "")
                .replace(/select-none/g, "");

              const hasUserChild = el.querySelector(
                '[class*="user-message"], [class*="human"], [data-message-author-role="user"], user-query, [class*="user-query"]',
              );
              const hasAssistantChild = el.querySelector(
                '[class*="claude-message"], [class*="assistant"], [class*="bot"], [data-message-author-role="assistant"], model-response, response-container, message-content, [class*="model-response"], [class*="response-container"]',
              );

              const tagName = (el.tagName || "").toLowerCase();
              if (
                cleanClassName.includes("font-user-message") ||
                testId.includes("user") ||
                cleanClassName.match(isUserClass) ||
                hasUserChild ||
                tagName.includes("user-query")
              ) {
                role = "user";
              } else if (
                cleanClassName.includes("font-claude-message") ||
                testId.includes("assistant") ||
                cleanClassName.match(isAssistantClass) ||
                hasAssistantChild ||
                tagName.includes("model-response") ||
                tagName.includes("response-container") ||
                tagName.includes("message-content")
              ) {
                role = "assistant";
              } else {
                const textContent = (el as HTMLElement).innerText || el.textContent || "";
                if (textContent.match(/^\s*(You said|You|User):?/i)) {
                  role = "user";
                } else if (textContent.match(/^\s*(ChatGPT|Claude|Gemini|Assistant|Grok|Bot|AI)( said)?:?/i)) {
                  role = "assistant";
                } else {
                  role = null;
                }
              }
            }

            return {
              role,
              text: (() => {
                const clone = el.cloneNode(true) as HTMLElement;
                clone.querySelectorAll('script, style, svg, button, nav, header, footer, [aria-hidden="true"], .sr-only, .visually-hidden, .cdk-visually-hidden').forEach(n => n.remove());
                let t = clone.innerText || clone.textContent || "";
                t = t.replace(/Uploaded an image/gi, "");
                t = t.replace(/Show moreShow less/gi, "");
                return t.trim();
              })(),
              timestamp: timestamp || undefined,
              imagesUrls: allImgs.filter(
                (src) => !src.includes("avatar") && !src.includes("profile"),
              ),
            };
          })
          .filter((msg) => msg.text.trim() !== "" || msg.imagesUrls.length > 0); // Filter out truly empty messages
      },
    );

    // Post-process to fix null roles using flip-flop logic
    let isUser = true;
    for (const msg of messagesData) {
      if (!msg.role) {
        msg.role = isUser ? "user" : "assistant";
      }
      isUser = msg.role !== "user"; // next should be the opposite
    }

    if (messagesData.length === 0) {
      console.log(
        "No messages extracted with Puppeteer DOM selectors, trying static HTML fallback...",
      );
      const html = await page.content();
      const extracted = extractMessagesFromHtml(html);
      return {
        title: extracted.title,
        messages: extracted.messages.map((m) => ({
          role: m.role,
          text: m.content,
          timestamp: m.timestamp,
          images: [],
          imagesUrls: [],
        })),
      };
    }

    // Download images and replace with local paths
    const messages = [];
    for (const msg of messagesData) {
      const localImages = [];
      if (extractImages) {
        for (let i = 0; i < msg.imagesUrls.length; i++) {
          const imgUrl = msg.imagesUrls[i];
          const urlParts = imgUrl.split("?")[0].split("/");
          const lastPart = urlParts[urlParts.length - 1] || "";
          const extMatch = lastPart.match(/\.([a-zA-Z0-9]{1,4})$/);
          const ext = extMatch ? extMatch[1].toLowerCase() : "png";
          const filename = `${crypto.randomUUID()}.${ext}`;
          const filepath = path.join(
            process.cwd(),
            "storage",
            "images",
            filename,
          );

          try {
            if (imgUrl.startsWith("http")) {
              const response = await fetch(imgUrl, {
                headers: {
                  "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                  Referer: url || "https://chatgpt.com/",
                },
              });
              if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                fs.writeFileSync(filepath, buffer);
                localImages.push(`images/${filename}`);
              } else {
                localImages.push(imgUrl);
              }
            } else if (imgUrl.startsWith("data:image")) {
              const matches = imgUrl.match(
                /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/,
              );
              if (matches && matches.length === 3) {
                const buffer = Buffer.from(matches[2], "base64");
                fs.writeFileSync(filepath, buffer);
                localImages.push(`images/${filename}`);
              } else {
                localImages.push(imgUrl);
              }
            } else {
              localImages.push(imgUrl);
            }
          } catch (err) {
            console.error(`Failed to download ${imgUrl}:`, err);
            localImages.push(imgUrl);
          }
        }
      }

      messages.push({
        role: msg.role,
        text: msg.text,
        timestamp: msg.timestamp,
        images: localImages,
      });
    }

    console.log('Puppeteer extracted:', messages.length);
    console.log('Puppeteer Extracted messages length:', messages.length);
    // Deduplicate perfectly adjacent identical texts
    const deduplicatedMessages = messages.filter((msg, idx) => {
      if (idx === 0) return true;
      const prevMsg = messages[idx - 1];
      return (
        msg.text.trim() !== prevMsg.text.trim() || msg.role !== prevMsg.role
      );
    });

    const pageTitle = (await page.title()) || "Extracted Chat";
    return { title: pageTitle, messages: deduplicatedMessages };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

app.post("/api/extract", async (req, res) => {
  try {
    const { url, extractImages = true } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    console.log(
      `Extracting from URL via Puppeteer: ${url} (extractImages: ${extractImages})`,
    );

    const { title, messages } = await extractChatWithImages(url, extractImages);

    // Format them for the frontend
    const now = Date.now();
    const formattedMessages = messages.map((m, index) => ({
      role: m.role,
      content: m.text,
      images: m.images,
      timestamp:
        m.timestamp ||
        new Date(now - (messages.length - index) * 60000).toISOString(), // Placeholder: 1 minute apart
    }));

    // If completely empty, just return error
    if (formattedMessages.length === 0) {
      return res.status(422).json({
        error: "PARSING_FAILED",
        message:
          "Could not find any chat messages in the provided URL using Puppeteer extraction.",
        suggestion:
          "The link might be private, or the platform structure has changed.",
      });
    }

    res.json({ title, messages: formattedMessages });
  } catch (error: any) {
    if (error.message && error.message.includes("CLOUDFLARE_BLOCKED")) {
      console.warn("Extraction blocked by Cloudflare for URL:", req.body.url);
      return res.status(403).json({
        error: "CLOUDFLARE_BLOCKED",
        message: "This link is protected by Cloudflare and cannot be extracted automatically.",
        suggestion: "Please use the 'Save as HTML' method directly in your browser and use the 'Upload HTML File' option instead.",
      });
    }

    console.error("Extraction error:", error);

    if (
      error.name === "TimeoutError" ||
      (error.message && error.message.includes("timeout"))
    ) {
      return res.status(504).json({
        error: "TIMEOUT",
        message:
          "Extraction timed out. Cloudflare might have blocked the headless browser or the page took too long to load.",
        suggestion: "Try again, or use Markdown/HTML export instead.",
      });
    }

    res.status(500).json({
      error: "EXTRACTION_ERROR",
      message:
        error.message || "An unexpected error occurred during extraction.",
    });
  }
});

app.post("/api/extract-html", async (req, res) => {
  try {
    const { html } = req.body;
    if (!html || html.length < 100) {
      return res.status(400).json({
        error: "INVALID_INPUT",
        message:
          "The uploaded file is empty or too small to be a valid chat export.",
      });
    }

    const { title, messages } = extractMessagesFromHtml(html);

    if (messages.length === 0) {
      return res.status(422).json({
        error: "PARSING_FAILED",
        message: "Could not extract structured messages from this HTML file.",
        suggestion:
          'Ensure you saved the "Complete" page (Ctrl+S) and didn\'t change the filename extension.',
      });
    }

    const now = Date.now();

    // Download images if possible
    for (const msg of messages) {
      msg.imagesUrls = msg.imagesUrls || [];
      const localImages = [];
      for (let i = 0; i < msg.imagesUrls.length; i++) {
        const imgUrl = msg.imagesUrls[i];
        const urlParts = imgUrl.split("?")[0].split("/");
        const lastPart = urlParts[urlParts.length - 1] || "";
        const extMatch = lastPart.match(/\.([a-zA-Z0-9]{1,4})$/);
        const ext = extMatch ? extMatch[1].toLowerCase() : "png";
        const filename = `${crypto.randomUUID()}.${ext}`;
        const filepath = path.join(
          process.cwd(),
          "storage",
          "images",
          filename,
        );

        try {
          // Only try to fetch if it's a real absolute URL, avoid data URIs or relative paths
          if (imgUrl.startsWith("http")) {
            const response = await fetch(imgUrl, {
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                Referer: "https://chatgpt.com/",
              },
            });
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              fs.writeFileSync(filepath, buffer);
              localImages.push(`images/${filename}`);
            } else {
              localImages.push(imgUrl);
            }
          } else if (imgUrl.startsWith("data:image")) {
            // handle data URIs
            const matches = imgUrl.match(
              /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/,
            );
            if (matches && matches.length === 3) {
              const buffer = Buffer.from(matches[2], "base64");
              fs.writeFileSync(filepath, buffer);
              localImages.push(`images/${filename}`);
            } else {
              localImages.push(imgUrl);
            }
          } else {
            localImages.push(imgUrl);
          }
        } catch (err) {
          console.error(`Failed to download ${imgUrl}:`, err);
          localImages.push(imgUrl);
        }
      }
      (msg as any).images = localImages;
    }

    const formattedMessages = messages.map((m, index) => ({
      role: m.role,
      content: m.content,
      images: (m as any).images || [],
      timestamp:
        m.timestamp ||
        new Date(now - (messages.length - index) * 60000).toISOString(),
    }));

    res.json({ title, messages: formattedMessages });
  } catch (error: any) {
    console.error("Extraction error:", error);
    res.status(500).json({
      error: "EXTRACTION_ERROR",
      message: error.message || "Failed to process the uploaded HTML file.",
    });
  }
});

function extractJsonObject(text: string, prefix: string) {
  const index = text.indexOf(prefix);
  if (index === -1) return null;
  let startIndex = index + prefix.length;
  // Skip whitespace
  while (startIndex < text.length && /\s/.test(text[startIndex])) startIndex++;

  if (text[startIndex] !== "{" && text[startIndex] !== "[") return null;

  const isArray = text[startIndex] === "[";
  const openChar = isArray ? "[" : "{";
  const closeChar = isArray ? "]" : "}";
  let openCount = 0;
  let insideString = false;
  let escapeNext = false;

  for (let i = startIndex; i < text.length; i++) {
    const char = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === "\\") {
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      insideString = !insideString;
      continue;
    }

    if (!insideString) {
      if (char === openChar) openCount++;
      else if (char === closeChar) openCount--;

      if (openCount === 0) {
        return text.substring(startIndex, i + 1);
      }
    }
  }
  return null;
}

function extractAllJsonObjects(text: string) {
  const results: any[] = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "{" || text[i] === "[") {
      let j = i;
      let insideString = false;
      let escapeNext = false;
      let openCount = 0;
      const openChar = text[i];
      const closeChar = openChar === "{" ? "}" : "]";
      let found = false;

      for (; j < text.length; j++) {
        const char = text[j];
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        if (char === "\\") {
          escapeNext = true;
          continue;
        }
        if (char === '"') {
          insideString = !insideString;
          continue;
        }
        if (!insideString) {
          if (char === openChar) openCount++;
          else if (char === closeChar) openCount--;
          if (openCount === 0) {
            found = true;
            break;
          }
        }
      }

      if (found) {
        const jsonStr = text.substring(i, j + 1);
        if (
          jsonStr.length > 50 &&
          (jsonStr.includes('"role"') ||
            jsonStr.includes('"parts"') ||
            jsonStr.includes('"human"'))
        ) {
          try {
            results.push(JSON.parse(jsonStr));
          } catch (e) {}
        }
        i = j; // Skip the parsed object
      }
    }
  }
  return results;
}

function extractMessagesFromHtml(html: string) {
  const $ = cheerio.load(html);

  const messages: {
    role: string;
    content: string;
    timestamp?: string;
    imagesUrls?: string[];
  }[] = [];
  let title = $("title").text() || "Extracted Chat";

  // Heuristics for different parsers

  // 1. Try to find __NEXT_DATA__ (old ChatGPT)
  const nextData = $("#__NEXT_DATA__").html();
  if (nextData) {
    try {
      const jsonData = JSON.parse(nextData);
      // Deep search for messages
      const searchMessages = (obj: any) => {
        if (!obj) return;
        if (Array.isArray(obj)) {
          obj.forEach(searchMessages);
        } else if (typeof obj === "object") {
          let timestamp: string | undefined = undefined;
          if (obj.create_time) {
            const ts =
              typeof obj.create_time === "number"
                ? obj.create_time
                : parseFloat(obj.create_time);
            if (!isNaN(ts))
              timestamp = new Date(ts > 1e11 ? ts : ts * 1000).toISOString();
          } else if (obj.createdAt || obj.created_at || obj.timestamp) {
            const ts = obj.createdAt || obj.created_at || obj.timestamp;
            if (typeof ts === "number")
              timestamp = new Date(ts > 1e11 ? ts : ts * 1000).toISOString();
            else timestamp = new Date(ts).toISOString();
          }
          if (timestamp === "Invalid Date") timestamp = undefined;

          if (
            obj.role &&
            obj.content &&
            typeof obj.content === "object" &&
            obj.content.parts
          ) {
            // ChatGPT API-like structure
            messages.push({
              role: obj.role,
              content: obj.content.parts.join("\n"),
              timestamp,
            });
          } else {
            Object.values(obj).forEach(searchMessages);
          }
        }
      };
      searchMessages(jsonData);
    } catch (e) {
      console.error("Failed to parse __NEXT_DATA__", e);
    }
  }

  // 2. Try Remix Context or generic JSON in scripts
  if (messages.length === 0) {
    $("script").each((_, el) => {
      const text = $(el).html();
      if (!text) return;

      // Extract anything that looks like JSON or window.state assignments
      if (
        text.includes("__remixContext") ||
        text.includes("__INITIAL_STATE__") ||
        text.includes("human") ||
        text.includes("parts")
      ) {
        try {
          let parsed = null;

          // First try robust JSON extraction if there is an assignment
          if (text.includes("__remixContext")) {
            let jsonStr = extractJsonObject(text, "window.__remixContext =");
            if (!jsonStr) jsonStr = extractJsonObject(text, "__remixContext =");
            if (!jsonStr) jsonStr = extractJsonObject(text, "__remixContext=");
            if (jsonStr) parsed = JSON.parse(jsonStr);
          } else if (text.includes("__INITIAL_STATE__")) {
            let jsonStr = extractJsonObject(text, "window.__INITIAL_STATE__ =");
            if (!jsonStr)
              jsonStr = extractJsonObject(text, "__INITIAL_STATE__ =");
            if (!jsonStr)
              jsonStr = extractJsonObject(text, "__INITIAL_STATE__=");
            if (jsonStr) parsed = JSON.parse(jsonStr);
          }

          // Fallback to basic match if the robust extractor failed or prefix wasn't found
          if (!parsed) {
            const jsonList = extractAllJsonObjects(text);
            for (const jsonObj of jsonList) {
              // Try searching messages in each brute-force extracted json
              const searchMessages = (obj: any) => {
                if (!obj) return;
                if (Array.isArray(obj)) {
                  obj.forEach(searchMessages);
                } else if (typeof obj === "object") {
                  // ChatGPT API / Next.js / Remix pattern
                  if (
                    obj.author &&
                    obj.author.role &&
                    obj.content &&
                    obj.content.parts
                  ) {
                    messages.push({
                      role: obj.author.role,
                      content: Array.isArray(obj.content.parts)
                        ? obj.content.parts.join("\n")
                        : String(obj.content.parts),
                    });
                  }
                  // ChatGPT Alternative pattern
                  else if (
                    obj.role &&
                    obj.content &&
                    typeof obj.content === "object" &&
                    obj.content.parts
                  ) {
                    messages.push({
                      role: obj.role,
                      content: Array.isArray(obj.content.parts)
                        ? obj.content.parts.join("\n")
                        : String(obj.content.parts),
                    });
                  }
                  // Claude pattern
                  else if (
                    (obj.sender === "human" || obj.sender === "assistant") &&
                    obj.text
                  ) {
                    messages.push({
                      role: obj.sender === "human" ? "user" : "assistant",
                      content:
                        typeof obj.text === "string"
                          ? obj.text
                          : JSON.stringify(obj.text),
                    });
                  }
                  // Generic LLM pattern
                  else if (
                    typeof obj.role === "string" &&
                    (obj.role === "user" ||
                      obj.role === "assistant" ||
                      obj.role === "model") &&
                    typeof obj.content === "string"
                  ) {
                    messages.push({
                      role: obj.role === "model" ? "assistant" : obj.role,
                      content: obj.content,
                    });
                  }
                  // Continue deep search
                  else {
                    Object.values(obj).forEach(searchMessages);
                  }
                }
              };
              searchMessages(jsonObj);
            }
          } else {
            // Normal search if prefix extractor successfully parsed the structure
            const searchMessages = (obj: any) => {
              if (!obj) return;
              if (Array.isArray(obj)) {
                obj.forEach(searchMessages);
              } else if (typeof obj === "object") {
                let timestamp: string | undefined = undefined;
                if (obj.create_time) {
                  const ts =
                    typeof obj.create_time === "number"
                      ? obj.create_time
                      : parseFloat(obj.create_time);
                  if (!isNaN(ts))
                    timestamp = new Date(
                      ts > 1e11 ? ts : ts * 1000,
                    ).toISOString();
                } else if (obj.createdAt || obj.created_at || obj.timestamp) {
                  const ts = obj.createdAt || obj.created_at || obj.timestamp;
                  if (typeof ts === "number")
                    timestamp = new Date(
                      ts > 1e11 ? ts : ts * 1000,
                    ).toISOString();
                  else timestamp = new Date(ts).toISOString();
                }
                if (timestamp === "Invalid Date") timestamp = undefined;

                // ChatGPT API / Next.js / Remix pattern
                if (
                  obj.author &&
                  obj.author.role &&
                  obj.content &&
                  obj.content.parts
                ) {
                  messages.push({
                    role: obj.author.role,
                    content: Array.isArray(obj.content.parts)
                      ? obj.content.parts.join("\n")
                      : String(obj.content.parts),
                    timestamp,
                  });
                }
                // ChatGPT Alternative pattern
                else if (
                  obj.role &&
                  obj.content &&
                  typeof obj.content === "object" &&
                  obj.content.parts
                ) {
                  messages.push({
                    role: obj.role,
                    content: Array.isArray(obj.content.parts)
                      ? obj.content.parts.join("\n")
                      : String(obj.content.parts),
                    timestamp,
                  });
                }
                // Claude pattern
                else if (
                  (obj.sender === "human" || obj.sender === "assistant") &&
                  obj.text
                ) {
                  messages.push({
                    role: obj.sender === "human" ? "user" : "assistant",
                    content:
                      typeof obj.text === "string"
                        ? obj.text
                        : JSON.stringify(obj.text),
                    timestamp,
                  });
                }
                // Generic LLM pattern
                else if (
                  typeof obj.role === "string" &&
                  (obj.role === "user" ||
                    obj.role === "assistant" ||
                    obj.role === "model") &&
                  typeof obj.content === "string"
                ) {
                  messages.push({
                    role: obj.role === "model" ? "assistant" : obj.role,
                    content: obj.content,
                    timestamp,
                  });
                }
                // Continue deep search
                else {
                  Object.values(obj).forEach(searchMessages);
                }
              }
            };
            searchMessages(parsed);
          }
        } catch (e) {
          // Silently ignore parse errors for generic scripts
          // console.error(e);
        }
      }
    });
  }

  // 3. Regex Fallback: directly scan HTML text for ChatGPT signature patterns
  if (messages.length === 0) {
    const regex =
      /"role"\s*:\s*"([^"]+)"[^}]*"content_type"\s*:\s*"text"\s*,\s*"parts"\s*:\s*\[\s*"([\s\S]*?)"\s*\]/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      messages.push({
        role: match[1],
        // Basic unescape, although JSON.parse is better if possible
        content: match[2]
          .replace(/\\n/g, "\n")
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, "\\"),
      });
    }
  }

  // 4. Fallback to parsing DOM elements (Generic, Claude & ChatGPT)
  if (messages.length === 0) {
    let isUser = true;

    // Common selectors for chat messages in various tools
    let messageNodes = $(
      '.markdown, [data-message-author-role], .font-claude-message, .font-user-message, .message, .chat-message, [data-testid="message"], article, .prose, .ProseMirror, user-query, model-response, .model-response, .user-query, response-container, message-content, .message-row, .message-bubble, [class*="message-row"], [class*="message-bubble"]',
    );

    // Filter out nested nodes
    const topLevelNodes: any[] = [];
    messageNodes.each((_, el) => {
      if (
        $(el).closest(
          'nav, aside, [class*="sidebar"], [class*="menu"], header, [class*="header"], .drawer, .drawer-content',
        ).length > 0
      )
        return;
      let parent = el.parent;
      let isNested = false;
      while (parent && (parent.type as unknown as string) !== "root") {
        const $parent = $(parent as any);
        if (
          $parent.is(
            '.markdown, [data-message-author-role], .font-claude-message, .font-user-message, .message, .chat-message, [data-testid="message"], article, .prose, .ProseMirror, user-query, model-response, .model-response, .user-query, response-container, message-content, .message-row, .message-bubble, [class*="message-row"], [class*="message-bubble"]',
          )
        ) {
          isNested = true;
          break;
        }
        parent = parent.parent;
      }
      if (!isNested) {
        topLevelNodes.push(el);
      }
    });

    // Structural Fallback: If no standard chat message classes match, find the DOM node
    // with the most direct children that contain substantial text (likely the chat list container).
    if (topLevelNodes.length === 0) {
      let bestContainer: any = null;
      let maxScore = 0;
      
      $("body *").each((_, el) => {
        const $el = $(el);
        let blockChildrenCount = 0;
        $el.children().each((_, child) => {
          const $child = $(child);
          const textLength = $child.text().trim().length;
          // Count children that are actual visible blocks with some text
          if (textLength > 10 && !$child.is('script, style, noscript, nav, header, footer')) {
            blockChildrenCount++;
          }
        });
        
        // A typical chat has at least a few messages. If we find a container with many text blocks, it's a candidate.
        if (blockChildrenCount > maxScore && blockChildrenCount >= 2) {
          maxScore = blockChildrenCount;
          bestContainer = el;
        }
      });

      if (bestContainer) {
        $(bestContainer).children().each((_, child) => {
           const $child = $(child);
           if ($child.text().trim().length > 0 && !$child.is('script, style, noscript, nav, header, footer')) {
             topLevelNodes.push(child);
           }
        });
      }
    }

    if (topLevelNodes.length > 0) {
      $(topLevelNodes).each((_, el) => {
        const $el = $(el);
        let role = $el.attr("data-message-author-role");
        if (!role) {
          const childWithRole = $el.find("[data-message-author-role]").first();
          if (childWithRole.length > 0) {
            role = childWithRole.attr("data-message-author-role");
          }
        }
        if (!role) {
          const className = ($el.attr("class") || "").toLowerCase();
          const testId = ($el.attr("data-testid") || "").toLowerCase();
          const isUserClass =
            /(^|\s|-|_)(user|human|message-in|query|user-query)(\s|-|_|$)/i;
          const isAssistantClass =
            /(^|\s|-|_)(assistant|bot|ai|claude|prose|ProseMirror|message-out|model|model-response|gemini|chatgpt|response-container|message-content|grok)(\s|-|_|$)/i;
          const cleanClassName = className
            .replace(/user-select/g, "")
            .replace(/select-none/g, "");

          // Check inner HTML or children if class doesn't help
          const innerHtml = $el.html() || "";
          const hasUserChild =
            innerHtml.includes("font-user-message") ||
            innerHtml.includes('data-message-author-role="user"') ||
            innerHtml.includes("user-query");
          const hasAssistantChild =
            innerHtml.includes("font-claude-message") ||
            innerHtml.includes('data-message-author-role="assistant"') ||
            innerHtml.includes("model-response") ||
            innerHtml.includes("response-container") ||
            innerHtml.includes("message-content") ||
            innerHtml.includes("response-content");

          const tagName = (
            $el.prop("tagName") ||
            (el as any).name ||
            (el as any).tagName ||
            ""
          ).toLowerCase();
          if (
            cleanClassName.includes("font-user-message") ||
            testId.includes("user") ||
            cleanClassName.match(isUserClass) ||
            hasUserChild ||
            tagName.includes("user-query")
          ) {
            role = "user";
          } else if (
            cleanClassName.includes("font-claude-message") ||
            testId.includes("assistant") ||
            cleanClassName.match(isAssistantClass) ||
            hasAssistantChild ||
            tagName.includes("model-response")
          ) {
            role = "assistant";
          } else {
            const textContent = $el.text() || "";
            if (textContent.match(/^\s*(You said|You|User):?/i)) {
              role = "user";
            } else if (textContent.match(/^\s*(ChatGPT|Claude|Gemini|Assistant|Grok|Bot|AI)( said)?:?/i)) {
              role = "assistant";
            } else {
              role = isUser ? "user" : "assistant"; // fallback to flip-flop
            }
          }
        }

        const timeEl = $el.closest("div, article, [data-testid]").find("time");
        const timestamp =
          timeEl.length > 0 ? timeEl.attr("datetime") : undefined;

        const $clone = $el.clone();
        $clone.find('script, style, svg, noscript, nav, header, footer, button, [aria-hidden="true"], .sr-only, .visually-hidden, .cdk-visually-hidden').remove();
        let content = convert($clone.html() || "", {
          wordwrap: false,
          selectors: [{ selector: "pre", format: "dataTable" }],
        });
        content = content.replace(/Uploaded an image/gi, "");
        content = content.replace(/Show moreShow less/gi, "");

        const imgs = $el
          .find("img")
          .map((_, img) => {
            let src = $(img).attr("src");
            if (src && src.includes("_next/image") && src.includes("url=")) {
              try {
                // Prepend dummy origin to parse URL properly if it's a relative URL
                const parsedUrl = new URL(src, "https://dummy.com");
                const urlParam = parsedUrl.searchParams.get("url");
                if (urlParam) {
                  src = urlParam.startsWith("http")
                    ? urlParam
                    : `https://chatgpt.com${urlParam.startsWith("/") ? "" : "/"}${urlParam}`;
                }
              } catch (e) {}
            }
            // If it's a relative URL (but not _next/image), we might want to make it absolute if from ChatGPT, but skip for now
            return src;
          })
          .get()
          .filter(
            (src) =>
              typeof src === "string" &&
              (src.startsWith("http") || src.startsWith("data:image")) &&
              !src.includes("avatar") &&
              !src.includes("profile"),
          ) as string[];

        const bgImgs = $el
          .find('[style*="background-image"]')
          .map((_, div) => {
            const style = $(div).attr("style");
            if (style) {
              const match = style.match(/url\(["']?(.*?)["']?\)/);
              return match ? match[1] : null;
            }
            return null;
          })
          .get()
          .filter(
            (src) =>
              typeof src === "string" &&
              (src.startsWith("http") || src.startsWith("data:image")),
          ) as string[];

        const allImgs = [...imgs, ...bgImgs];

        if (content.trim() || allImgs.length > 0) {
          messages.push({
            role,
            content: content.trim(),
            timestamp,
            imagesUrls: allImgs,
          });
          if (role === "assistant") {
            isUser = true;
          } else if (role === "user") {
            isUser = false;
          } else {
            isUser = !isUser;
          }
        }
      });
    } else {
      // Absolute fallback: Just extract all text from the main container
      let main = $('main, .main, #content, [role="main"]').first();
      if (main.length === 0) main = $("body");

      const content = convert(main.html() || "", { wordwrap: false });

      // Ignore "cookie preferences" or footer boilerplate
      const cleanedContent = content
        .replace(/By messaging ChatGPT[\s\S]*Cookie Preferences\./i, "")
        .trim();

      if (cleanedContent.length > 20) {
        // Check if this looks like a generic transcript dump with "SOMEONE SAID:" markers
        const splitRegex = /\n?(?:(?:[A-Za-z0-9_ ]+) )?([A-Za-z0-9_]+) SAID:\n/ig;
        const hasMarkers = splitRegex.test(cleanedContent);
        
        if (hasMarkers) {
          // Reset lastIndex because test() modifies it
          splitRegex.lastIndex = 0;
          const parts = cleanedContent.split(splitRegex);
          // parts[0] is intro string
          for (let i = 1; i < parts.length; i += 2) {
            const speaker = parts[i] || "";
            const text = parts[i + 1] || "";
            if (!text.trim()) continue;
            
            let currentRole = "user";
            if (speaker.match(/chatgpt|claude|gemini|assistant|bot|ai|grok/i)) {
              currentRole = "assistant";
            }
            messages.push({
              role: currentRole,
              content: text.trim(),
            });
          }
        } else {
          messages.push({
            role: "unknown",
            content: cleanedContent,
          });
        }
      }
    }
  }

  if (messages.length === 0) {
    return { title, messages: [] };
  }

  console.log('Extracted messages length:', messages.length);
  // Remove Claude shared chat boilerplate/disclaimer
  let filteredMessages = messages.filter(msg => !(msg.content.includes('This is a copy of a chat between') && msg.content.includes('Anthropic')));

  // Deduplicate adjacent messages with the exact same content
  const deduplicatedMessages = filteredMessages.filter((msg, idx) => {
    if (idx === 0) return true;
    const prevMsg = filteredMessages[idx - 1];
    return msg.content.trim() !== prevMsg.content.trim() || msg.role !== prevMsg.role;
  });

  return { title, messages: deduplicatedMessages };
}

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
