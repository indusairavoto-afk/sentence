const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('gemini_dump_3.html', 'utf8');
const $ = cheerio.load(html);
$('*').each((i, el) => {
    if ($(el).children().length === 0 && $(el).text().includes('Slove it oops')) {
        console.log("Found leaf text node!");
        let parent = el.parent;
        while(parent && parent.type !== 'root') {
            console.log("  parent:", parent.name, $(parent).attr('class'));
            parent = parent.parent;
        }
    }
});
