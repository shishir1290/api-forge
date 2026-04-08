import { NextRequest, NextResponse } from "next/server";

// Allow preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}

export async function POST(req: NextRequest) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS",
    "Access-Control-Allow-Headers": "*",
  };

  try {
    const body = await req.json();
    const { method, url, headers: reqHeaders, body: requestBody } = body;

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400, headers: corsHeaders },
      );
    }

    // Validate URL is reachable (no localhost loop issues)
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: `Invalid URL: ${url}` },
        { status: 400, headers: corsHeaders },
      );
    }

    const startTime = Date.now();

    const fetchHeaders: Record<string, string> = {};
    if (reqHeaders && typeof reqHeaders === "object") {
      for (const [k, v] of Object.entries(reqHeaders)) {
        if (typeof v === "string") fetchHeaders[k] = v;
      }
    }

    const fetchOptions: RequestInit = {
      method: method || "GET",
      headers: fetchHeaders,
      // Don't follow redirects automatically — let user see them
      redirect: "follow",
    };

    if (
      requestBody &&
      method !== "GET" &&
      method !== "HEAD" &&
      method !== "OPTIONS"
    ) {
      fetchOptions.body = requestBody;
    }

    const response = await fetch(url, fetchOptions);
    const endTime = Date.now();

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const contentType = response.headers.get("content-type") || "";
    const isBinary = /image|pdf|video|audio|octet-stream/.test(contentType);

    let responseBody: string;
    if (isBinary) {
      const buffer = await response.arrayBuffer();
      responseBody = Buffer.from(buffer).toString("base64");
    } else {
      responseBody = await response.text();
    }

    return NextResponse.json(
      {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseBody,
        isBinary,
        time: endTime - startTime,
        size: isBinary
          ? Buffer.from(responseBody, "base64").length
          : new TextEncoder().encode(responseBody).length,
        url: response.url,
      },
      { headers: corsHeaders },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Request failed: ${message}` },
      { status: 500, headers: corsHeaders },
    );
  }
}
