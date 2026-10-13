interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
  GEMINI_API_KEY?: string;
  APP_ORIGIN?: string;
}

function withNoCache(response: Response) {
  const headers = new Headers(response.headers);
  headers.set("cache-control", "no-cache, no-store, must-revalidate");
  headers.set("pragma", "no-cache");
  headers.set("expires", "0");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === "/api/health" || url.pathname === "/ads/api/health") {
      return new Response(JSON.stringify({ status: "healthy", app: "pesat-ads-loop", version: "1.0.0" }), {
        headers: { "content-type": "application/json" },
      });
    }

    // Map /ads routes to ./out assets
    let assetPath = url.pathname;
    if (assetPath === "/ads" || assetPath === "/ads/") {
      assetPath = "/";
    } else if (assetPath.startsWith("/ads/")) {
      assetPath = assetPath.slice(4); // Remove leading "/ads"
    } else if (assetPath === "" || assetPath === "/") {
      assetPath = "/";
    }

    const assetUrl = new URL(request.url);
    assetUrl.pathname = assetPath;
    const assetRequest = new Request(assetUrl, request);

    let response = await env.ASSETS.fetch(assetRequest);

    // If 404 or redirect, try with trailing slash / or without
    if (response.status === 404 && !assetPath.includes(".")) {
      const fallbackUrl = new URL(request.url);
      fallbackUrl.pathname = assetPath.endsWith("/") ? assetPath.slice(0, -1) : assetPath + "/";
      const fallbackRes = await env.ASSETS.fetch(new Request(fallbackUrl, request));
      if (fallbackRes.status < 400) {
        response = fallbackRes;
      }
    }

    // Rewrite any internal 307/308 redirects that target "/" to "/ads/"
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (location) {
        let newLocation = location;
        if (location === "/" || location.startsWith("/?")) {
          newLocation = "/ads" + (location.startsWith("/?") ? location.slice(1) : "/");
        } else if (location.startsWith("/") && !location.startsWith("/ads")) {
          newLocation = "/ads" + location;
        }
        const newHeaders = new Headers(response.headers);
        newHeaders.set("location", newLocation);
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        });
      }
    }

    return withNoCache(response);
  },
};
