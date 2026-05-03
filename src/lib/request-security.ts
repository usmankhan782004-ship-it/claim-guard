import { getSiteUrl } from "@/lib/site";

export function isSameOrigin(request: Request) {
  const requestOrigin = request.headers.get("origin");

  if (!requestOrigin) {
    return true;
  }

  return requestOrigin === new URL(getSiteUrl()).origin;
}
