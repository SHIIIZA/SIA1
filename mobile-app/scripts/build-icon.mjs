import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const mobileRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(mobileRoot, "..");
const androidResources = join(mobileRoot, "android", "app", "src", "main", "res");
const logoSource = await readFile(join(repositoryRoot, "images", "tripmate.svg"), "utf8");
const markLayer = logoSource.match(/<g\b[^>]*clip-path="url\(#([^)]+)\)"[^>]*>([\s\S]*?)<\/g>/);

if (!markLayer) {
    throw new Error("Could not find the clipped logo mark in images/tripmate.svg.");
}

const markPath = markLayer[2].match(/<path\b([^>]*)\/>/);
const pathData = markPath?.[1].match(/\bd="([^"]+)"/)?.[1];
const sourceClip = logoSource.match(
    new RegExp(`<clipPath\\b[^>]*\\bid="${markLayer[1]}"[^>]*>([\\s\\S]*?)<\\/clipPath>`)
);

if (!pathData || !sourceClip) {
    throw new Error("Could not extract the logo mark path and clipping path from images/tripmate.svg.");
}

const backgroundColor = "#FAF7EF";
const standaloneMark = background => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-123 300 900 900">
    <defs><clipPath id="icon-clip">${sourceClip[1]}</clipPath></defs>
    ${background ? `<rect x="-123" y="300" width="900" height="900" fill="${background}"/>` : ""}
    <path clip-path="url(#icon-clip)" fill="#ff7a59" fill-rule="evenodd" d="${pathData}"/>
</svg>`;

async function render(svg, size) {
    return new Resvg(svg, { fitTo: { mode: "width", value: size } }).render().asPng();
}

const densities = [
    { directory: "mipmap-mdpi", launcher: 48, foreground: 108 },
    { directory: "mipmap-hdpi", launcher: 72, foreground: 162 },
    { directory: "mipmap-xhdpi", launcher: 96, foreground: 216 },
    { directory: "mipmap-xxhdpi", launcher: 144, foreground: 324 },
    { directory: "mipmap-xxxhdpi", launcher: 192, foreground: 432 }
];

const foregroundSvg = standaloneMark();
const launcherSvg = standaloneMark(backgroundColor);

for (const density of densities) {
    const directory = join(androidResources, density.directory);
    await mkdir(directory, { recursive: true });
    const launcher = await render(launcherSvg, density.launcher);
    const foreground = await render(foregroundSvg, density.foreground);

    await Promise.all([
        writeFile(join(directory, "ic_launcher.png"), launcher),
        writeFile(join(directory, "ic_launcher_round.png"), launcher),
        writeFile(join(directory, "ic_launcher_foreground.png"), foreground)
    ]);
}

await writeFile(
    join(androidResources, "values", "ic_launcher_background.xml"),
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${backgroundColor}</color>\n</resources>\n`,
    "utf8"
);

console.log("Generated Android launcher icons from the TripMate logo mark without its wordmark.");
