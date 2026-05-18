export function formatAuthFormError(rawMessage: string): string {
  if (rawMessage.includes("auth/configuration-not-found")) {
    return "Firebase Authentication is not enabled for this project. In Firebase Console, open Authentication, choose Sign-in method, and enable Email/Password.";
  }
  if (
    rawMessage.includes("auth/invalid-credential") ||
    rawMessage.includes("auth/wrong-password") ||
    rawMessage.includes("auth/user-not-found")
  ) {
    return "Email or password is incorrect.";
  }
  if (rawMessage.includes("auth/email-already-in-use")) {
    return "An account with this email already exists.";
  }
  if (rawMessage.includes("auth/weak-password")) {
    return "Password must be at least 6 characters.";
  }
  if (rawMessage.includes("auth/invalid-email")) {
    return "Enter a valid email address.";
  }
  return rawMessage;
}
