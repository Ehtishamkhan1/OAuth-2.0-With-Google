import {
  COOKIE_MAX_AGE,
  COOKIE_NAME,
  COOKIE_OPTIONS,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  JWT_EXPIRATION_TIME,
  JWT_SECRET,
  REFRESH_TOKEN_EXPIRY,
} from "@/constants";
import * as jose from "jose";

export async function POST(request: Request) {
  const body = await request.formData();
  const code = body.get("code") as string;
  const platform = (body.get("platform") as string) || "native";

  if (!code) {
    return Response.json({ error: "Missing code" }, { status: 400 });
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
      code: code,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.id_token) {
    return Response.json(
      { error: "Token exchange failed", details: data },
      { status: 500 }
    );
  }

  const userinfo = jose.decodeJwt(data.id_token) as any;
  const { exp, ...userInfoWithoutExp } = userinfo;

  const sub = userinfo.sub;
  const issuedAt = Math.floor(Date.now() / 1000);

  const accessToken = await new jose.SignJWT(userInfoWithoutExp)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(JWT_EXPIRATION_TIME)
    .setSubject(sub)
    .setIssuedAt(issuedAt)
    .sign(new TextEncoder().encode(JWT_SECRET));

    const refreshToken = await new jose.SignJWT(userInfoWithoutExp)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .setSubject(sub)
    .setIssuedAt(issuedAt)
    .sign(new TextEncoder().encode(JWT_SECRET));

  if (platform === "web") {
    const response = Response.json({
      success: true,
      issuedAt: issuedAt,
      expiredAt: issuedAt + COOKIE_MAX_AGE,
    });

    response.headers.set(
      "Set-Cookie",
      `${COOKIE_NAME}=${accessToken}; Max-Age=${COOKIE_OPTIONS.maxAge}; Path=${
        COOKIE_OPTIONS.path
      }; ${COOKIE_OPTIONS.httpOnly ? "HttpOnly;" : ""} ${
        COOKIE_OPTIONS.secure ? "Secure;" : ""
      } SameSite=${COOKIE_OPTIONS.sameSite}`
    );

    return response;
  }

  return Response.json({ accessToken, refreshToken });
}
