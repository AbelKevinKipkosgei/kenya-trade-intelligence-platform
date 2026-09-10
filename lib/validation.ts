/**
 * Password strength rule shared by signup and the account-settings
 * password change/set flow — kept in one place so the two never drift
 * apart (the eventual error message shown to a user has to match
 * whichever rule is actually enforced).
 * Must be at least 8 characters with uppercase, lowercase, and number.
 */
export function isValidPassword(password: string): boolean {
  if (password.length < 8) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}

export const PASSWORD_REQUIREMENTS_MESSAGE =
  "Password must be at least 8 characters and contain uppercase, lowercase, and number";
