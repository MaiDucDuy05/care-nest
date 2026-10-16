/**
 * IMEI-15 Luhn (LUHN-15) validation.
 *
 * Standard Luhn algorithm: double every second digit from the right
 * (i.e. odd indices when counting from the left, 0-based), sum the
 * digits, and check that `(10 - sum % 10) % 10` matches the last digit.
 *
 * Exposed separately so the spec tests can target it without spinning
 * up the whole module.
 */

const LUHN_INPUT_LENGTH = 14;

export function isValidImei(raw: string): boolean {
  if (typeof raw !== 'string' || !/^\d{15}$/.test(raw)) return false;
  const digits = raw.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < LUHN_INPUT_LENGTH; i++) {
    let d = digits[i];
    // Doubling pattern: from the right, every second digit. Since we
    // have 15 digits and the last is the check digit, indices 0, 2, 4, …
    // (the even ones) are the ones to double — equivalent to "every
    // second digit counting from the right" when the rightmost is
    // the check digit.
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === digits[LUHN_INPUT_LENGTH];
}

/**
 * Compute the check digit for the first 14 digits. Useful for
 * generating valid IMEIs in tests.
 */
export function computeImeiCheckDigit(first14: string): number {
  if (!/^\d{14}$/.test(first14)) {
    throw new Error('computeImeiCheckDigit expects 14 digits');
  }
  const digits = first14.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let d = digits[i];
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return (10 - (sum % 10)) % 10;
}
