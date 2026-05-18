import { createRemoteJWKSet, jwtVerify } from "jose";
import { getFirebaseWebConfig, isFirebaseConfigured } from "@/lib/firebase/env";
import { normalizeAppRole, type AppRole } from "./roles";

export type VerifiedAuth = {
  uid: string;
  email: string | null;
  role: AppRole;
};

const jwksByProject = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function getJwks(projectId: string) {
  let jwks = jwksByProject.get(projectId);
  if (!jwks) {
    jwks = createRemoteJWKSet(
      new URL(
        "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
      ),
    );
    jwksByProject.set(projectId, jwks);
  }
  return jwks;
}

export async function verifyFirebaseIdToken(token: string): Promise<VerifiedAuth> {
  const config = getFirebaseWebConfig();
  if (!config) {
    throw new Error("Firebase is not configured.");
  }

  const { payload } = await jwtVerify(token, getJwks(config.projectId), {
    issuer: `https://securetoken.google.com/${config.projectId}`,
    audience: config.projectId,
  });

  const uid = typeof payload.sub === "string" ? payload.sub : "";
  if (!uid) {
    throw new Error("Invalid auth token.");
  }

  const email = typeof payload.email === "string" ? payload.email : null;
  const role = normalizeAppRole(payload.role);

  return { uid, email, role };
}

export function extractBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) return null;
  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export function authRequiredInProduction(): boolean {
  return import.meta.env.PROD && isFirebaseConfigured();
}
