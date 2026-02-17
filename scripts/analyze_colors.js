const https = require('https');
const fs = require('fs');

const urls = [
    { name: 'Customer', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzE2ZDFmNzI0MmNlMzQ5NjA4MTAyNGE4MmUzZjExZWQyEgsSBxCo4bKZyA8YAZIBJAoKcHJvamVjdF9pZBIWQhQxNTAzOTY3NDE5NTMxMjI5MDI1MQ&filename=&opi=89354086' },
    { name: 'Staff', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzU5Y2RkYzM2YTc2ZjRkOWViNDlmNDZhNGRlZDA4MjdlEgsSBxCo4bKZyA8YAZIBJAoKcHJvamVjdF9pZBIWQhQxNTAzOTY3NDE5NTMxMjI5MDI1MQ&filename=&opi=89354086' }
];

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function extractColors(html) {
    const colorRegex = /#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|rgba\([^)]+\)|rgb\([^)]+\)/g;
    const matches = html.match(colorRegex) || [];
    const counts = {};
    for (const c of matches) {
        counts[c] = (counts[c] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
}

async function run() {
    let output = '';
    for (const page of urls) {
        output += `Analyzing ${page.name}...\n`;
        try {
            const html = await fetchUrl(page.url);
            const colors = extractColors(html);
            output += `Top colors for ${page.name}: ${JSON.stringify(colors)}\n\n`;
        } catch (e) {
            output += `Error fetching ${page.name}: ${e.message}\n`;
        }
    }
    fs.writeFileSync('colors_utf8.txt', output, 'utf8');
}

run();
