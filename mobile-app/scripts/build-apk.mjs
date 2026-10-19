import { copyFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const mobileDirectory = resolve(scriptDirectory, "..");
const androidDirectory = join(mobileDirectory, "android");
const androidSdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT ||
    join(process.env.LOCALAPPDATA || "", "Android", "Sdk");
const environment = { ...process.env };

if (!environment.ANDROID_HOME && !environment.ANDROID_SDK_ROOT && existsSync(androidSdk)) {
    environment.ANDROID_HOME = androidSdk;
    environment.ANDROID_SDK_ROOT = androidSdk;
}

const wrapper = join(androidDirectory, process.platform === "win32" ? "gradlew.bat" : "gradlew");
const command = process.platform === "win32" ? "java" : wrapper;
const argumentsList = process.platform === "win32"
    ? ["-classpath", join(androidDirectory, "gradle", "wrapper", "gradle-wrapper.jar"),
        "org.gradle.wrapper.GradleWrapperMain", "assembleDebug", "--no-daemon"]
    : ["assembleDebug", "--no-daemon"];
const build = spawnSync(command, argumentsList, {
    cwd: androidDirectory,
    env: environment,
    stdio: "inherit",
});

if (build.error) throw build.error;
if (build.status !== 0) process.exit(build.status || 1);

const apk = join(androidDirectory, "app", "build", "outputs", "apk", "debug", "app-debug.apk");
const deliverable = join(mobileDirectory, "app", "build", "outputs", "tripmate", "TripMate.apk");
if (!existsSync(apk)) throw new Error(`Gradle completed but the APK was not found at ${apk}.`);
await mkdir(dirname(deliverable), { recursive: true });
await copyFile(apk, deliverable);
console.log(`Built and copied the Android APK to ${deliverable}`);
