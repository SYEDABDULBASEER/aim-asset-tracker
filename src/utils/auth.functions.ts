import { createServerFn } from "@tanstack/react-start";
import { getAuth } from "firebase-admin/auth";
import { z } from "zod";
import { requireRole } from "@/lib/auth/require-auth";
import { isFirebaseAdminConfigured, getFirebaseAdminApp } from "@/lib/firebase/admin";
import { isFirebaseConfigured } from "@/lib/firebase/env";
import type { AppRole } from "@/lib/auth/roles";

const RegisterAuthUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["admin", "agent", "user"]),
});

export const registerAuthUser = createServerFn({ method: "POST" })
  .inputValidator(RegisterAuthUserSchema)
  .handler(async ({ data }) => {
    requireRole("admin");
    if (!isFirebaseConfigured()) {
      throw new Error("Firebase is not configured. Add VITE_FIREBASE_* to .env.");
    }
    if (!isFirebaseAdminConfigured()) {
      throw new Error(
        "Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT_PATH in .env.",
      );
    }

    const email = data.email.trim().toLowerCase();
    const role: AppRole = data.role;
    const auth = getAuth(getFirebaseAdminApp());

    try {
      const user = await auth.createUser({
        email,
        password: data.password,
      });
      await auth.setCustomUserClaims(user.uid, { role });
      return { email, role };
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error
          ? String((error as { code?: string }).code ?? "")
          : "";
      if (code === "auth/email-already-exists") {
        throw new Error("An account with this email already exists.");
      }
      if (code === "auth/invalid-password") {
        throw new Error("Password must be at least 6 characters.");
      }
      throw error instanceof Error ? error : new Error("Registration failed.");
    }
  });
