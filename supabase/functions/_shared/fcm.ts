/**
 * Firebase Cloud Messaging HTTP v1.
 * Secret: FIREBASE_SERVICE_ACCOUNT = full service-account JSON from
 * Firebase Console → Project settings → Service accounts.
 */

type ServiceAccount = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

function jsonResponseHint() {
  return Deno.env.get("FIREBASE_SERVICE_ACCOUNT") ?? Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON") ?? "";
}

function readServiceAccount(): ServiceAccount | null {
  const raw = jsonResponseHint().trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ServiceAccount;
  } catch {
    console.error("fcm: FIREBASE_SERVICE_ACCOUNT is not valid JSON");
    return null;
  }
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function encodeJson(value: Record<string, unknown>): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(value)));
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pkcs8 = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");
  const raw = Uint8Array.from(atob(pkcs8), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    raw,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function getAccessToken(account: ServiceAccount): Promise<string | null> {
  if (!account.client_email || !account.private_key) return null;
  const now = Math.floor(Date.now() / 1000);
  const header = encodeJson({ alg: "RS256", typ: "JWT" });
  const claim = encodeJson({
    iss: account.client_email,
    sub: account.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  });
  const unsigned = `${header}.${claim}`;
  const key = await importPrivateKey(account.private_key);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  );
  const jwt = `${unsigned}.${toBase64Url(new Uint8Array(signature))}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    console.error("fcm: access token failed", res.status, data);
    return null;
  }
  return String(data.access_token);
}

export function isFcmConfigured(): boolean {
  return Boolean(readServiceAccount()?.private_key);
}

export async function sendFcmToTokens(params: {
  tokens: string[];
  title: string;
  message: string;
  link: string;
  type?: string;
  notificationId?: number;
}): Promise<{ sent: number; removed: string[]; skipped?: string; error?: string }> {
  const account = readServiceAccount();
  if (!account) return { sent: 0, removed: [], skipped: "fcm_not_configured" };
  if (!params.tokens.length) return { sent: 0, removed: [], skipped: "no_tokens" };

  const accessToken = await getAccessToken(account);
  if (!accessToken) return { sent: 0, removed: [], error: "fcm_auth_failed" };

  const projectId = account.project_id || "wya254";
  const endpoint = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
  const removed: string[] = [];
  let sent = 0;

  for (const token of params.tokens) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title: params.title, body: params.message },
          data: {
            title: params.title,
            body: params.message,
            link: params.link,
            type: params.type ?? "",
            notification_id: params.notificationId != null ? String(params.notificationId) : "",
          },
          webpush: {
            fcm_options: { link: params.link },
            notification: {
              title: params.title,
              body: params.message,
              icon: "/favicon.ico",
            },
          },
        },
      }),
    });

    if (res.ok) {
      sent += 1;
      continue;
    }

    const err = await res.json().catch(() => ({}));
    const status = err?.error?.status || err?.error?.details?.[0]?.errorCode;
    console.error("fcm: send failed", res.status, status, err);
    if (status === "UNREGISTERED" || status === "NOT_FOUND" || res.status === 404) {
      removed.push(token);
    }
  }

  return { sent, removed };
}
