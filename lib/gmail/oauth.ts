import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { google } from "googleapis";
import { db } from "../db.ts";

const GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

function getEncryptionKey(): Buffer {
  const hex = process.env.TOKEN_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). See .env.example."
    );
  }
  return Buffer.from(hex, "hex");
}

function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("hex"), authTag.toString("hex"), ciphertext.toString("hex")].join(":");
}

function decrypt(payload: string): string {
  const key = getEncryptionKey();
  const [ivHex, authTagHex, ciphertextHex] = payload.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}

function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000/api/auth/google/callback";
  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set. See README for the Google Cloud setup steps."
    );
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function buildAuthUrl(): string {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GMAIL_SCOPES,
  });
}

export async function exchangeCodeForTokens(code: string): Promise<void> {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
    throw new Error(
      "Google did not return a full token set (access_token/refresh_token/expiry_date). " +
        "If you've authorized this app before, revoke access at https://myaccount.google.com/permissions and try again " +
        "so Google issues a fresh refresh_token."
    );
  }

  await db.oAuthToken.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      accessToken: encrypt(tokens.access_token),
      refreshToken: encrypt(tokens.refresh_token),
      expiryDate: new Date(tokens.expiry_date),
      scope: tokens.scope ?? GMAIL_SCOPES.join(" "),
    },
    update: {
      accessToken: encrypt(tokens.access_token),
      refreshToken: encrypt(tokens.refresh_token),
      expiryDate: new Date(tokens.expiry_date),
      scope: tokens.scope ?? GMAIL_SCOPES.join(" "),
    },
  });
}

/** Returns a valid access token, refreshing it first if it's expired or about to expire. */
export async function getValidAccessToken(): Promise<string> {
  const row = await db.oAuthToken.findUnique({ where: { id: "singleton" } });
  if (!row) {
    throw new Error("No Gmail account connected yet. Visit /api/auth/google to connect one.");
  }

  const refreshToken = decrypt(row.refreshToken);
  const expiresSoon = row.expiryDate.getTime() - Date.now() < 60_000;

  if (!expiresSoon) {
    return decrypt(row.accessToken);
  }

  const client = getOAuthClient();
  client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await client.refreshAccessToken();
  if (!credentials.access_token || !credentials.expiry_date) {
    throw new Error("Failed to refresh Gmail access token — the refresh token may have been revoked.");
  }

  await db.oAuthToken.update({
    where: { id: "singleton" },
    data: {
      accessToken: encrypt(credentials.access_token),
      expiryDate: new Date(credentials.expiry_date),
    },
  });

  return credentials.access_token;
}

export async function isGmailConnected(): Promise<boolean> {
  const row = await db.oAuthToken.findUnique({ where: { id: "singleton" } });
  return row !== null;
}
