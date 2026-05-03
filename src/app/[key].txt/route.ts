import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: { key: string } }
) {
  const expectedKey = process.env.INDEXNOW_KEY;

  if (!expectedKey || params.key !== expectedKey) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(expectedKey, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
