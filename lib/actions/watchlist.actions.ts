'use server';

import Watchlist from '@/database/models/watchlist.model';
import { connectToDatabase } from '@/database/mongoose';
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

async function getCurrentUserId(): Promise<string | null> {
    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user.id ?? null;
}

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if (!db) throw new Error('MongoDB connection not found');

        const user = await db.collection<{ id?: string }>('user').findOne({ email }, { projection: { id: 1 } });
        if (!user) return [];

        const userId = user.id || user._id.toString();
        const items = await Watchlist.find({ userId }).select('symbol -_id').lean();
        return items.map((item) => item.symbol);
    } catch (error) {
        console.error('Error fetching watchlist symbols:', error);
        return [];
    }
}

export async function getWatchlistByEmail(email: string): Promise<StockWithData[]> {
    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if (!db) return [];

        const user = await db.collection<{ id?: string }>('user').findOne({ email }, { projection: { id: 1 } });
        if (!user) return [];

        const userId = user.id || user._id.toString();
        const items = await Watchlist.find({ userId }).sort({ addedAt: -1 }).lean();
        return items.map((item) => ({
            userId: item.userId,
            symbol: item.symbol,
            company: item.company,
            addedAt: item.addedAt,
        }));
    } catch (error) {
        console.error('Error fetching watchlist:', error);
        return [];
    }
}

export async function addToWatchlist(symbol: string, company: string): Promise<{ success: boolean; error?: string }> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return { success: false, error: 'You must be signed in.' };

        const cleanSymbol = symbol.trim().toUpperCase();
        const cleanCompany = company.trim();
        if (!cleanSymbol || !cleanCompany) return { success: false, error: 'Stock information is incomplete.' };

        await connectToDatabase();
        await Watchlist.updateOne(
            { userId, symbol: cleanSymbol },
            { $setOnInsert: { userId, symbol: cleanSymbol, company: cleanCompany, addedAt: new Date() } },
            { upsert: true },
        );
        revalidatePath('/watchlist');
        return { success: true };
    } catch (error) {
        console.error('Error adding stock to watchlist:', error);
        return { success: false, error: 'Could not add this stock.' };
    }
}

export async function removeFromWatchlist(symbol: string): Promise<{ success: boolean; error?: string }> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return { success: false, error: 'You must be signed in.' };

        await connectToDatabase();
        await Watchlist.deleteOne({ userId, symbol: symbol.trim().toUpperCase() });
        revalidatePath('/watchlist');
        return { success: true };
    } catch (error) {
        console.error('Error removing stock from watchlist:', error);
        return { success: false, error: 'Could not remove this stock.' };
    }
}
