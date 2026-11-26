/** 0–4: length plus variety. Guidance only; the server enforces the real minimum. */
export function passwordStrength(password: string): number {
  if (password.length < 8) return password.length ? 1 : 0;
  let score = 1;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}
