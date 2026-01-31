import { NextRequest } from "next/server";
import { env } from "@scout/env/apps-www";
import { auth } from "@/lib/auth";
import { validateProxyRequestModel } from "@/server-lib/proxy-model-validation";

const ANTHROPIC_API_BASE = "https://api.anthropic.com/";
const DEFAULT_ANTHROPIC_PATH = "v1/messages";
const ANTHROPIC_API_VERSION = "2023-06-01";

export const dynamic = "force-dynamic";

type HandlerArgs = { params: { path?: string[] } };
type AuthContext = { userId: string };

function buildTargetUrl(
  request: NextRequest,
  pathSegments: string[] | undefined,
) {
  const pathname =
    pathSegments && pathSegments.length > 0
      ? pathSegments.join("/")
      : DEFAULT_ANTHROPIC_PATH;

  const targetUrl = new URL(pathname, ANTHROPIC_API_BASE);
  const search = request.nextUrl.search;
  if (search) {
    targetUrl.search = search;
  }

  return targetUrl;
}

async function proxyRequest(
  request: NextRequest,
  args: HandlerArgs,
  _authContext: AuthContext,
) {
  const params = await args.params;
  const targetUrl = buildTargetUrl(request, params.path);

  const validation = await validateProxyRequestModel({
    request,
    provider: "anthropic",
  });
  if (!validation.valid) {
    return new Response(validation.error, { status: 400 });
  }

  const headers = new Headers();
  for (const [key, value] of request.headers.entries()) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey === "host" ||
      lowerKey === "content-length" ||
      lowerKey === "connection" ||
      lowerKey === "x-api-key" ||
      lowerKey === "authorization"
    ) {
      continue;
    }
    headers.set(key, value);
  }
  headers.set("x-api-key", env.ANTHROPIC_API_KEY);
  if (!headers.has("anthropic-version")) {
    headers.set("anthropic-version", ANTHROPIC_API_VERSION);
  }

  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.arrayBuffer();

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body,
    redirect: "manual",
  });

  const responseHeaders = new Headers();
  for (const [key, value] of response.headers.entries()) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey === "content-length" ||
      lowerKey === "connection" ||
      lowerKey === "transfer-encoding" ||
      lowerKey === "content-encoding"
    ) {
      continue;
    }
    responseHeaders.set(key, value);
  }

  const origin = request.headers.get("origin");
  if (origin) {
    responseHeaders.set("Access-Control-Allow-Origin", origin);
    responseHeaders.set("Access-Control-Allow-Credentials", "true");
    responseHeaders.append("Vary", "Origin");
  } else {
    responseHeaders.set("Access-Control-Allow-Origin", "*");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

async function authorize(
  request: NextRequest,
): Promise<
  | { response: Response; userId?: undefined }
  | { response: null; userId: string }
> {
  const token = getDaemonTokenFromHeaders(request.headers);

  if (!token) {
    return { response: new Response("Unauthorized", { status: 401 }) };
  }

  try {
    const { valid, error, key } = await auth.api.verifyApiKey({
      body: { key: token },
    });

    const userId = key?.userId;

    if (error || !valid || !userId) {
      console.log("Unauthorized Anthropic proxy request", { error, valid });
      return { response: new Response("Unauthorized", { status: 401 }) };
    }

    return { response: null, userId };
  } catch (err) {
    console.error("Failed to verify Anthropic proxy request", err);
    return { response: new Response("Unauthorized", { status: 401 }) };
  }
}

async function handleWithAuth(
  request: NextRequest,
  args: HandlerArgs,
  handler: (
    request: NextRequest,
    args: HandlerArgs,
    context: AuthContext,
  ) => Promise<Response>,
) {
  const authResult = await authorize(request);
  if (authResult.response) {
    return authResult.response;
  }
  return handler(request, args, { userId: authResult.userId });
}

export async function GET(request: NextRequest, args: HandlerArgs) {
  return handleWithAuth(request, args, proxyRequest);
}

export async function POST(request: NextRequest, args: HandlerArgs) {
  return handleWithAuth(request, args, proxyRequest);
}

export async function PUT(request: NextRequest, args: HandlerArgs) {
  return handleWithAuth(request, args, proxyRequest);
}

export async function PATCH(request: NextRequest, args: HandlerArgs) {
  return handleWithAuth(request, args, proxyRequest);
}

export async function DELETE(request: NextRequest, args: HandlerArgs) {
  return handleWithAuth(request, args, proxyRequest);
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  const allowOrigin = origin ?? "*";
  const allowHeaders =
    request.headers.get("access-control-request-headers") ??
    "authorization, content-type";

  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": allowHeaders,
    Vary: "Origin",
  };

  if (allowOrigin !== "*") {
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return new Response(null, {
    status: 204,
    headers,
  });
}

function getDaemonTokenFromHeaders(headers: Headers) {
  const directToken = headers.get("X-Daemon-Token");
  if (directToken && directToken.trim() !== "") {
    return directToken.trim();
  }

  const authHeader = headers.get("authorization");
  if (!authHeader) {
    return null;
  }

  const match = authHeader.match(/^\s*Bearer\s+(.*)$/i);
  if (match && match[1]) {
    const token = match[1]!.trim();
    return token === "" ? null : token;
  }

  return null;
}
