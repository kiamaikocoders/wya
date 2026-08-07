import { AwsClient } from "aws4fetch";

export type R2PutEnv = {
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET?: string;
  R2_ENDPOINT?: string;
  R2_PUBLIC_BASE_URL?: string;
};

/**
 * Upload bytes to R2 from the server (avoids browser→R2 CORS failures).
 */
export async function putObjectToR2(options: {
  env: R2PutEnv;
  key: string;
  contentType: string;
  body: ArrayBuffer | Uint8Array | Buffer;
}): Promise<{ publicUrl: string; key: string }> {
  const { env, key, contentType, body } = options;
  const accountId = env.R2_ACCOUNT_ID?.trim() || "";
  const accessKeyId = env.R2_ACCESS_KEY_ID?.trim() || "";
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY?.trim() || "";
  const bucket = env.R2_BUCKET?.trim() || "wya-media";
  const endpoint =
    env.R2_ENDPOINT?.trim() ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");
  const publicBase = (
    env.R2_PUBLIC_BASE_URL?.trim() || "https://cdn.wya254.com"
  ).replace(/\/$/, "");

  if (!accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error("R2 is not configured on the server");
  }
  if (accessKeyId.length !== 32) {
    throw new Error(
      `R2_ACCESS_KEY_ID has length ${accessKeyId.length}, should be 32 — check Vercel env (value may be truncated)`,
    );
  }

  const aws = new AwsClient({
    accessKeyId,
    secretAccessKey,
    service: "s3",
    region: "auto",
  });

  const url = `${endpoint}/${bucket}/${key}`;
  const signed = await aws.sign(
    new Request(url, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
      body,
    }),
  );

  const putRes = await fetch(signed);
  if (!putRes.ok) {
    const detail = await putRes.text().catch(() => "");
    throw new Error(
      `R2 put failed (${putRes.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`,
    );
  }

  return {
    key,
    publicUrl: `${publicBase}/${key}`,
  };
}
