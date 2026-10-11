import mongoose, { Schema, Document } from 'mongoose';

export interface ICounterDocument extends Document {
  name: string;
  year: number;
  sequenceValue: number;
}

const CounterSchema = new Schema<ICounterDocument>(
  {
    name: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    sequenceValue: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

CounterSchema.index({ name: 1, year: 1 }, { unique: true });

export const Counter = mongoose.model<ICounterDocument>('Counter', CounterSchema);
