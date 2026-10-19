import { cp, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const mobileDirectory = resolve(scriptDirectory, "..");
const repositoryDirectory = resolve(mobileDirectory, "..");
const webDirectory = join(mobileDirectory, "www");
const androidPublicDirectory = join(mobileDirectory, "android", "app", "src", "main", "assets", "public");
const androidSdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT ||
    join(process.env.LOCALAPPDATA || "", "Android", "Sdk");
if (!process.env.ANDROID_HOME && !process.env.ANDROID_SDK_ROOT && existsSync(androidSdk)) {
    process.env.ANDROID_HOME = androidSdk;
    process.env.ANDROID_SDK_ROOT = androidSdk;
}

for (const directory of ["css", "host", "images", "js"]) {
    await cp(join(repositoryDirectory, directory), join(webDirectory, directory), {
        recursive: true,
        force: true
    });
}

const rootFiles = await readdir(repositoryDirectory, { withFileTypes: true });
for (const entry of rootFiles) {
    if (entry.isFile() && entry.name.endsWith(".html")) {
        await cp(join(repositoryDirectory, entry.name), join(webDirectory, entry.name));
    }
}

async function prepareMobilePage(pagePath) {
    let html = await readFile(pagePath, "utf8");
    html = html.replace(
        /<meta\s+name=["']viewport["']\s+content=["']([^"']*)["']\s*\/?>/i,
        (_match, content) => {
            const viewport = content.includes("viewport-fit=") ? content : `${content}, viewport-fit=cover`;
            return `<meta name="viewport" content="${viewport}">`;
        }
    );

    const mobileStylesheet = '<link rel="stylesheet" href="/css/mobile-native.css">';
    const mobileBootstrap = '<script src="/js/mobile-bootstrap.js"></script>';
    const additions = [
        html.includes('href="/css/mobile-native.css"') ? "" : mobileStylesheet,
        html.includes('src="/js/mobile-bootstrap.js"') ? "" : mobileBootstrap
    ].filter(Boolean).join("\n    ");

    if (additions) {
        if (!/<\/head>/i.test(html)) throw new Error(`Cannot add mobile runtime to ${pagePath}: missing </head>.`);
        html = html.replace(/<\/head>/i, `    ${additions}\n</head>`);
    }
    await writeFile(pagePath, html, "utf8");
}

async function preparePages(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        const entryPath = join(directory, entry.name);
        if (entry.isDirectory()) await preparePages(entryPath);
        else if (entry.isFile() && entry.name.endsWith(".html")) await prepareMobilePage(entryPath);
    }
}

await preparePages(webDirectory);
await mkdir(androidPublicDirectory, { recursive: true });
await cp(webDirectory, androidPublicDirectory, { recursive: true, force: true });
console.log(`Prepared current web app and API client in ${androidPublicDirectory}`);
