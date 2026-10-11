import { Counter } from '../models/Counter.js';

export async function generateVoucherNumber(year = new Date().getFullYear()): Promise<string> {
  const counter = await Counter.findOneAndUpdate(
    { name: 'voucherNumber', year },
    { $inc: { sequenceValue: 1 } },
    { new: true, upsert: true }
  );

  const paddedSequence = String(counter.sequenceValue).padStart(4, '0');
  return `EV-${year}-${paddedSequence}`;
}
