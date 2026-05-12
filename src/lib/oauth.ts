const QF_AUTH_BASE = "https://oauth2.quran.foundation";
const CLIENT_ID = import.meta.env.VITE_QURAN_CLIENT_ID as string;
const SCOPES = "openid offline_access user";

const VERIFIER_KEY = "qf_pkce_verifier";
const STATE_KEY = "qf_oauth_state";
const TOKEN_KEY = "qf_access_token";
const REFRESH_KEY = "qf_refresh_token";
const EXPIRY_KEY = "qf_token_expiry";
const GUEST_KEY = "qf_guest_mode";

export interface QFTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number;
  idToken: string | null;
}

export interface QFUser {
  sub: string;
  name?: string;
  email?: string;
  preferred_username?: string;
}

function base64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function initiateLogin(): Promise<void> {
  const arr32 = new Uint8Array(32);
  crypto.getRandomValues(arr32);
  const verifier = base64url(arr32.buffer as ArrayBuffer);
  const hashBuf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  const challenge = base64url(hashBuf);
  const arr16a = new Uint8Array(16);
  crypto.getRandomValues(arr16a);
  const state = base64url(arr16a.buffer as ArrayBuffer);
  const arr16b = new Uint8Array(16);
  crypto.getRandomValues(arr16b);
  const nonce = base64url(arr16b.buffer as ArrayBuffer);

  sessionStorage.setItem(VERIFIER_KEY, verifier);
  sessionStorage.setItem(STATE_KEY, state);

  const redirectUri = `${window.location.origin}/`;
  const url = new URL(`${QF_AUTH_BASE}/oauth2/auth`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("state", state);
  url.searchParams.set("nonce", nonce);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");

  window.location.href = url.toString();
}

export async function exchangeCallback(
  code: string,
  returnedState: string,
): Promise<QFTokens | null> {
  const storedState = sessionStorage.getItem(STATE_KEY);
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  if (!verifier || storedState !== returnedState) return null;

  sessionStorage.removeItem(VERIFIER_KEY);
  sessionStorage.removeItem(STATE_KEY);

  try {
    const res = await fetch("/api/qf-exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        codeVerifier: verifier,
        redirectUri: `${window.location.origin}/`,
      }),
    });
    if (!res.ok) return null;
    return (await res.json()) as QFTokens;
  } catch {
    return null;
  }
}

export function parseIdToken(idToken: string): QFUser | null {
  try {
    const payload = idToken.split(".")[1];
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    );
    return {
      sub: decoded.sub,
      name: decoded.name,
      email: decoded.email,
      preferred_username: decoded.preferred_username,
    };
  } catch {
    return null;
  }
}

export function saveTokens(tokens: QFTokens): void {
  const expiry = Date.now() + tokens.expiresIn * 1000;
  localStorage.setItem(TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(EXPIRY_KEY, String(expiry));
  if (tokens.refreshToken)
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
}

export function loadSavedSession(): { accessToken: string } | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = Number(localStorage.getItem(EXPIRY_KEY) ?? 0);
  if (!token || Date.now() > expiry) return null;
  return { accessToken: token };
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(EXPIRY_KEY);
}

export function setGuestMode(enabled: boolean): void {
  if (enabled) localStorage.setItem(GUEST_KEY, "1");
  else localStorage.removeItem(GUEST_KEY);
}

export function isGuestMode(): boolean {
  return localStorage.getItem(GUEST_KEY) === "1";
}
