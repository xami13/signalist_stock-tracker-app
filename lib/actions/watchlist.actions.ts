'use server';

import Watchlist from '@/database/models/watchlist.model';
import { connectToDatabase } from '@/database/mongoose';

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
