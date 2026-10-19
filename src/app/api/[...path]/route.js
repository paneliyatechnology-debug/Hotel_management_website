import { NextResponse } from "next/server";

const TARGET_BASE_URL = (
  process.env.NEXT_PUBLIC_LIVE_API_URL ||
  "https://hotelmanagementbackendnew-production.up.railway.app"
).replace(/\/+$/, "");

async function proxyRequest(request, context) {
  try {
    const params = await context.params;
    const pathSegments = params?.path || [];
    const path = Array.isArray(pathSegments) ? pathSegments.join("/") : pathSegments;
    const url = new URL(request.url);
    const targetUrl = `${TARGET_BASE_URL}/api/${path}${url.search}`;

    const headers = new Headers();
    request.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (
        lower !== "host" &&
        lower !== "origin" &&
        lower !== "referer" &&
        lower !== "content-length" &&
        lower !== "transfer-encoding" &&
        lower !== "connection" &&
        lower !== "keep-alive"
      ) {
        headers.set(key, value);
      }
    });

    // Emulate allowed origin so Railway server allows the request
    headers.set("Origin", "https://myownpms.com");
    headers.set("Referer", "https://myownpms.com");

    const method = request.method;
    const fetchOptions = {
      method,
      headers,
    };

    if (method !== "GET" && method !== "HEAD") {
      const contentType = request.headers.get("content-type") || "";
      if (contentType.includes("multipart/form-data")) {
        headers.delete("content-type");
        headers.delete("content-length");
        const incomingFormData = await request.formData();
        const outgoingFormData = new FormData();
        for (const [key, value] of incomingFormData.entries()) {
          outgoingFormData.append(key, value);
        }
        fetchOptions.body = outgoingFormData;
      } else {
        const bodyText = await request.text();
        if (bodyText) {
          fetchOptions.body = bodyText;
        }
      }
    }

    const response = await fetch(targetUrl, fetchOptions);
    const responseHeaders = new Headers();

    response.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (!lower.startsWith("access-control-") && lower !== "content-encoding") {
        responseHeaders.set(key, value);
      }
    });

    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    responseHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");

    const data = await response.arrayBuffer();
    return new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("[Next API Proxy Error]:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Proxy request failed" },
      { status: 502 }
    );
  }
}

export async function GET(request, context) {
  return proxyRequest(request, context);
}

export async function POST(request, context) {
  return proxyRequest(request, context);
}

export async function PUT(request, context) {
  return proxyRequest(request, context);
}

export async function PATCH(request, context) {
  return proxyRequest(request, context);
}

export async function DELETE(request, context) {
  return proxyRequest(request, context);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    },
  });
}
