/** Age checks for alcohol / restricted sponsor content (KDPA + terms: 18+). */

export function ageFromDobUtc(dateOfBirth: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return null;
  const [y, m, d] = dateOfBirth.split('-').map(Number);
  const birth = new Date(Date.UTC(y, m - 1, d));
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const md = today.getUTCMonth() * 100 + today.getUTCDate() - (birth.getUTCMonth() * 100 + birth.getUTCDate());
  if (md < 0) age -= 1;
  return age;
}

export function isVerifiedAdultFromDob(dateOfBirth: string | null | undefined, minAge = 18): boolean {
  if (!dateOfBirth) return false;
  const age = ageFromDobUtc(dateOfBirth);
  return age !== null && age >= minAge;
}
