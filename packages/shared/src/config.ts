export const APP_NAME = "sat-x";

/** Reads an env var and throws early (at boot) instead of failing silently later. */
export function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}
