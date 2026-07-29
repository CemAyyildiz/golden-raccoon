import { NextResponse } from "next/server";
import { z } from "zod";
import { withCacheHeaders } from "@/server/cache/strategy";
import { runTokenScan } from "@/server/scan/tokenScan";
import { checkRateLimit } from "@/server/security/rateLimit";
import { commonErrorCodes, jsonError } from "@/server/api/errors";

const bodySchema = z.object({
  query: z.string().min(1).max(260),
  chain: z.string().min(1).max(40).optional(),
  walletAddress: z.string().min(1).max(80).optional(),
});

export async function POST(request: Request) {
  const rateLimited = checkRateLimit(request, { namespace: "scan:token", limit: 25, windowMs: 60_000 });

  if (rateLimited) {
    return rateLimited;
  }

  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    // The `error` field is kept for existing clients; `code`/`message`/`retryable`/
    // `requestId` are the stable fields new clients should read.
    return jsonError(
      { code: commonErrorCodes.validationError, message: "Request validation failed.", status: 400, details: parsed.error.flatten() },
      { legacy: { error: parsed.error.flatten() } },
    );
  }

  return withCacheHeaders(NextResponse.json(await runTokenScan(parsed.data.query, parsed.data.chain, parsed.data.walletAddress)), "scan");
}
