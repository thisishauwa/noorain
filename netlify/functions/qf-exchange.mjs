export const handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { code, codeVerifier, redirectUri } = JSON.parse(event.body ?? "{}");
    if (!code || !codeVerifier || !redirectUri) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing required params" }) };
    }

    const clientId = process.env.QF_CLIENT_ID;
    const clientSecret = process.env.QF_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Server not configured" }) };
    }

    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    });

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const res = await fetch("https://oauth2.quran.foundation/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: params.toString(),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        statusCode: res.status,
        headers,
        body: JSON.stringify({ error: data.error ?? "Exchange failed", detail: data }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? null,
        expiresIn: data.expires_in ?? 3600,
        idToken: data.id_token ?? null,
      }),
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Internal error" }) };
  }
};
