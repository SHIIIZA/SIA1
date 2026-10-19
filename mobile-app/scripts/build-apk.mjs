import { copyFile, mkdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const mobileRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const androidRoot = join(mobileRoot, "android");
const gradleWrapper = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
const build = spawnSync(gradleWrapper, ["assembleDebug"], {
    cwd: androidRoot,
    stdio: "inherit",
    shell: process.platform === "win32"
});

if (build.error) throw build.error;
if (build.status !== 0) process.exit(build.status ?? 1);

const sourceApk = join(androidRoot, "app", "build", "outputs", "apk", "debug", "app-debug.apk");
const outputDirectory = join(androidRoot, "app", "build", "outputs", "tripmate");
const outputApk = join(outputDirectory, "TripMate.apk");
await mkdir(outputDirectory, { recursive: true });
await copyFile(sourceApk, outputApk);
console.log(`Created ${outputApk}`);
