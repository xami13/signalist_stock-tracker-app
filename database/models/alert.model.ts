import { model, models, Schema, type Document, type Model } from 'mongoose';

export interface PriceAlertDocument extends Document {
    userId: string;
    symbol: string;
    company: string;
    alertName: string;
    alertType: 'upper' | 'lower';
    threshold: number;
    frequency: 'minute' | 'hour' | 'day';
    createdAt: Date;
}

const alertSchema = new Schema<PriceAlertDocument>({
    userId: { type: String, required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    company: { type: String, required: true, trim: true },
    alertName: { type: String, required: true, trim: true },
    alertType: { type: String, enum: ['upper', 'lower'], required: true },
    threshold: { type: Number, required: true, min: 0 },
    frequency: { type: String, enum: ['minute', 'hour', 'day'], default: 'day' },
    createdAt: { type: Date, default: Date.now },
});

alertSchema.index({ userId: 1, symbol: 1, alertName: 1 });

const PriceAlert: Model<PriceAlertDocument> = models?.PriceAlert || model<PriceAlertDocument>('PriceAlert', alertSchema);

export default PriceAlert;
