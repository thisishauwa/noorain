const QF_AUTH_BASE =
  process.env.QF_AUTH_BASE || "https://oauth2.quran.foundation";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { code, codeVerifier, redirectUri } = req.body;
    if (!code || !codeVerifier || !redirectUri) {
      return res.status(400).json({ error: "Missing required params" });
    }

    const clientId = process.env.QF_CLIENT_ID;
    const clientSecret = process.env.QF_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: "Server not configured" });
    }

    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    });

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64",
    );
    const response = await fetch(`${QF_AUTH_BASE}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: params.toString(),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error ?? "Exchange failed",
        detail: data,
      });
    }

    return res.status(200).json({
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? null,
      expiresIn: data.expires_in ?? 3600,
      idToken: data.id_token ?? null,
    });
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
}
