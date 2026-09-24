import { EventEmitter } from "node:events";
import { initializeAdminAccount, initializeCatalogListings, routeApi } from "../../server.js";

function routePath(event) {
    const rawPath = event.path || "/api/health";
    const functionPrefix = "/.netlify/functions/api";
    const withoutFunctionPrefix = rawPath.startsWith(functionPrefix)
        ? rawPath.slice(functionPrefix.length) || "/"
        : rawPath;
    return withoutFunctionPrefix.startsWith("/api/")
        ? withoutFunctionPrefix
        : `/api${withoutFunctionPrefix === "/" ? "/health" : withoutFunctionPrefix}`;
}

function createRequest(event) {
    const request = new EventEmitter();
    request.method = event.httpMethod || "GET";
    request.headers = Object.fromEntries(
        Object.entries(event.headers || {}).map(([key, value]) => [key.toLowerCase(), value])
    );
    return request;
}

function createResponse() {
    let resolveResponse;
    const completed = new Promise((resolve) => { resolveResponse = resolve; });
    const response = {
        statusCode: 200,
        headers: {},
        writeHead(status, headers) {
            this.statusCode = status;
            this.headers = headers || {};
        },
        end(body = "") {
            resolveResponse({
                statusCode: this.statusCode,
                headers: this.headers,
                body: Buffer.isBuffer(body) ? body.toString("utf8") : String(body)
            });
        }
    };
    return { response, completed };
}

function parseBody(event) {
    if (!event.body) return "";
    return event.isBase64Encoded
        ? Buffer.from(event.body, "base64").toString("utf8")
        : event.body;
}

export async function handler(event) {
    const method = event.httpMethod || "GET";
    const headers = {
        "Access-Control-Allow-Origin": process.env.FRONTEND_URL || "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS"
    };

    if (method === "OPTIONS") {
        return { statusCode: 204, headers, body: "" };
    }

    try {
        await initializeAdminAccount();
        await initializeCatalogListings();
    } catch (error) {
        console.error("Unable to seed TripMate database:", error.message);
    }

    const request = createRequest(event);
    const { response, completed } = createResponse();
    const url = new URL(routePath(event), "https://netlify.local");
    const routePromise = routeApi(request, response, url);

    if (["POST", "PATCH", "PUT"].includes(method)) {
        const body = parseBody(event);
        process.nextTick(() => {
            if (body) request.emit("data", body);
            request.emit("end");
        });
    }

    try {
        await routePromise;
        const result = await completed;
        return { statusCode: result.statusCode, headers: result.headers, body: result.body };
    } catch (error) {
        return {
            statusCode: error.status || 500,
            headers: { ...headers, "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify({ error: error.message || "Server error" })
        };
    }
}