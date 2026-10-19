import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as sass from "sass";

const mobileRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(mobileRoot, "..");
const outputRoot = join(mobileRoot, "www");
const sourceDirectories = ["css", "host", "images", "js"];

async function findHtmlFiles(directory, relativePath = "") {
    const entries = await readdir(directory, { withFileTypes: true });
    const paths = [];
    for (const entry of entries) {
        const relative = join(relativePath, entry.name);
        if (entry.isDirectory()) {
            paths.push(...await findHtmlFiles(join(directory, entry.name), relative));
        } else if (entry.isFile() && entry.name.endsWith(".html")) {
            paths.push(relative);
        }
    }
    return paths;
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

for (const directory of sourceDirectories) {
    await cp(join(repositoryRoot, directory), join(outputRoot, directory), { recursive: true });
}

const rootFiles = await readdir(repositoryRoot, { withFileTypes: true });
const htmlFiles = [
    ...rootFiles.filter(file => file.isFile() && file.name.endsWith(".html")).map(file => file.name),
    ...await findHtmlFiles(join(repositoryRoot, "host"), "host")
];
for (const relativePath of htmlFiles) {
    const html = await readFile(join(repositoryRoot, relativePath), "utf8");
    if (!html.includes("</head>")) {
        throw new Error(`Cannot add mobile assets: ${relativePath} has no closing head tag.`);
    }
    const mobileAssets = [
        '<meta name="theme-color" content="#FAF7EF">',
        '<link rel="stylesheet" href="/css/mobile-native.css">',
        '<script src="/js/mobile-bootstrap.js"></script>'
    ].join("\n    ");
    const outputPath = join(outputRoot, relativePath);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(
        outputPath,
        html.replace("</head>", `    ${mobileAssets}\n</head>`),
        "utf8"
    );
<<<<<<< Updated upstream
=======

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
>>>>>>> Stashed changes
}

const scssPath = join(mobileRoot, "src", "mobile-native.scss");
const compiledTheme = sass.compile(scssPath, { style: "compressed" });
await writeFile(join(outputRoot, "css", "mobile-native.css"), compiledTheme.css, "utf8");

const bootstrapPath = join(outputRoot, "js", "mobile-bootstrap.js");
await writeFile(bootstrapPath, [
    'window.TRIPMATE_API_BASE = "https://trypmate.netlify.app/api";',
    'document.documentElement.classList.add("tripmate-native");',
    ""
].join("\n"), "utf8");

console.log(`Packaged ${htmlFiles.length} TripMate pages with the shared website CSS and JavaScript.`);
