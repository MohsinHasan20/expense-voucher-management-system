/**
 * Currency utility to prevent floating-point calculation errors.
 * Amounts in the database are stored as integers in minor units (paise/cents).
 * e.g., ₹1250.50 is stored as 125050.
 */

export function toMinorUnits(amount: number | string): number {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error('Amount must be a positive valid number');
  }
  return Math.round(numericAmount * 100);
}

export function toMajorUnits(minorUnits: number): number {
  if (typeof minorUnits !== 'number' || isNaN(minorUnits)) {
    return 0;
  }
  return Number((minorUnits / 100).toFixed(2));
}

export function formatCurrency(minorUnits: number, currency = 'INR'): string {
  const major = toMajorUnits(minorUnits);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(major);
}
