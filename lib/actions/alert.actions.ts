'use server';

import PriceAlert from '@/database/models/alert.model';
import { connectToDatabase } from '@/database/mongoose';
import { auth } from '@/lib/better-auth/auth';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

async function getCurrentUserId(): Promise<string | null> {
    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user.id ?? null;
}

export async function getAlerts(): Promise<PriceAlert[]> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return [];
        await connectToDatabase();
        const alerts = await PriceAlert.find({ userId }).sort({ createdAt: -1 }).lean();
        return alerts.map((alert) => ({
            id: alert._id.toString(),
            symbol: alert.symbol,
            company: alert.company,
            alertName: alert.alertName,
            alertType: alert.alertType,
            threshold: alert.threshold,
            frequency: alert.frequency,
        }));
    } catch (error) {
        console.error('Error fetching alerts:', error);
        return [];
    }
}

export async function saveAlert(input: PriceAlertInput): Promise<{ success: boolean; error?: string }> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return { success: false, error: 'You must be signed in.' };
        const threshold = Number(input.threshold);
        if (!input.alertName.trim() || !input.symbol.trim() || !Number.isFinite(threshold) || threshold <= 0) {
            return { success: false, error: 'Enter a name and a valid threshold.' };
        }

        await connectToDatabase();
        const values = {
            userId,
            symbol: input.symbol.trim().toUpperCase(),
            company: input.company.trim(),
            alertName: input.alertName.trim(),
            alertType: input.alertType,
            threshold,
            frequency: input.frequency,
        };
        if (input.id) {
            await PriceAlert.updateOne({ _id: input.id, userId }, { $set: values });
        } else {
            await PriceAlert.create(values);
        }
        revalidatePath('/watchlist');
        return { success: true };
    } catch (error) {
        console.error('Error saving alert:', error);
        return { success: false, error: 'Could not save this alert.' };
    }
}

export async function deleteAlert(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return { success: false, error: 'You must be signed in.' };
        await connectToDatabase();
        await PriceAlert.deleteOne({ _id: id, userId });
        revalidatePath('/watchlist');
        return { success: true };
    } catch (error) {
        console.error('Error deleting alert:', error);
        return { success: false, error: 'Could not delete this alert.' };
    }
}
