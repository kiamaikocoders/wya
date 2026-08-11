/**
 * Set CORS on the wya-media R2 bucket.
 *
 * Object Read/Write API tokens cannot call PutBucketCors (AccessDenied).
 * Use either:
 *   npx wrangler login
 *   npx wrangler r2 bucket cors set wya-media --file scripts/r2-cors.json -y
 *
 * Or Cloudflare Dashboard → R2 → wya-media → Settings → CORS policy
 * and paste scripts/r2-cors.json.
 *
 * Optional: CLOUDFLARE_API_TOKEN with Account R2 Admin, then:
 *   node scripts/set-r2-cors.mjs
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const corsPath = resolve(__dirname, "r2-cors.dashboard.json");
const rules = JSON.parse(readFileSync(corsPath, "utf8"));

const accountId =
  process.env.R2_ACCOUNT_ID?.trim() ||
  process.env.CLOUDFLARE_ACCOUNT_ID?.trim() ||
  "";
const token = process.env.CLOUDFLARE_API_TOKEN?.trim() || "";
const bucket = process.env.R2_BUCKET?.trim() || "wya-media";

if (!accountId || !token) {
  console.error(
    "Missing CLOUDFLARE_API_TOKEN and/or R2_ACCOUNT_ID.\n" +
      "Dashboard: paste scripts/r2-cors.dashboard.json into R2 → wya-media → Settings → CORS.\n" +
      "Or: npx wrangler login && npx wrangler r2 bucket cors set wya-media --file scripts/r2-cors.json -y",
  );
  process.exit(1);
}

const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucket}/cors`;
const res = await fetch(url, {
  method: "PUT",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ rules }),
});
const text = await res.text();
console.log(res.status, text.slice(0, 500));
if (!res.ok) process.exit(1);
