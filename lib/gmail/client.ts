import { google, gmail_v1 } from "googleapis";
import { getValidAccessToken } from "./oauth.ts";

export async function getGmailClient(): Promise<gmail_v1.Gmail> {
  const accessToken = await getValidAccessToken();
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.gmail({ version: "v1", auth });
}

/** Retries a Gmail API call with exponential backoff on 429/5xx responses. */
export async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 5): Promise<T> {
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      const status = (err as { code?: number; response?: { status?: number } })?.code
        ?? (err as { response?: { status?: number } })?.response?.status;
      attempt++;
      const retryable = status === 429 || (typeof status === "number" && status >= 500);
      if (!retryable || attempt >= maxAttempts) {
        throw err;
      }
      const delayMs = Math.min(2 ** attempt * 500, 15_000);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
