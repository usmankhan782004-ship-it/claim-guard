import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/site";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

function normalizePath(path: string) {
  if (!path.startsWith("/")) {
    return `/${path}`;
  }

  return path;
}

export async function POST(request: NextRequest) {
  const indexNowKey = process.env.INDEXNOW_KEY;

  if (!indexNowKey) {
    return NextResponse.json(
      { error: "INDEXNOW_KEY is not configured." },
      { status: 400 }
    );
  }

  const siteUrl = getSiteUrl();
  const site = new URL(siteUrl);
  const keyLocation = `${site.origin}/${indexNowKey}.txt`;

  const body = (await request.json().catch(() => ({}))) as {
    urls?: string[];
    paths?: string[];
  };

  const suppliedPaths = [...(body.urls ?? []), ...(body.paths ?? [])]
    .filter(Boolean)
    .map((value) => value.trim());

  const urlList = suppliedPaths.length
    ? suppliedPaths.map((value) =>
        value.startsWith("http") ? value : `${site.origin}${normalizePath(value)}`
      )
    : [site.origin, `${site.origin}/pricing`];

  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      host: site.host,
      key: indexNowKey,
      keyLocation,
      urlList,
    }),
  });

  const responseText = await response.text();

  return NextResponse.json(
    {
      success: response.ok,
      status: response.status,
      response: responseText,
      submitted: urlList,
    },
    { status: response.ok ? 200 : 502 }
  );
}
