import { NextResponse } from "next/server";
import https from "https";

const PROD_API = "https://onemoregift.in/api/v1";

// Disable TLS cert check for local dev proxy only
const agent = new https.Agent({ rejectUnauthorized: false });

async function handler(req, { params }) {
    const pathParts = (await params).path || [];
    const targetPath = pathParts.join("/");
    const search = new URL(req.url).search;
    const targetUrl = `${PROD_API}/${targetPath}${search}`;

    const headers = {};
    for (const [key, val] of req.headers.entries()) {
        if (!["host", "connection", "transfer-encoding"].includes(key)) {
            headers[key] = val;
        }
    }
    headers["host"] = "onemoregift.in";

    let body = undefined;
    if (!["GET", "HEAD"].includes(req.method)) {
        body = await req.text();
    }

    try {
        const res = await fetch(targetUrl, {
            method: req.method,
            headers,
            body,
            // @ts-ignore
            dispatcher: undefined,
            agent,
        });

        const data = await res.arrayBuffer();
        const resHeaders = new Headers();
        for (const [key, val] of res.headers.entries()) {
            if (!["transfer-encoding", "connection"].includes(key)) {
                resHeaders.set(key, val);
            }
        }
        resHeaders.set("Access-Control-Allow-Origin", "*");

        return new NextResponse(data, {
            status: res.status,
            headers: resHeaders,
        });
    } catch (err) {
        console.error("Proxy error:", err.message);
        return NextResponse.json({ error: true, msg: err.message }, { status: 502 });
    }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
