import { headers } from 'next/headers';
import WatchlistDashboard from '@/components/WatchlistDashboard';
import { auth } from '@/lib/better-auth/auth';
import { getAlerts } from '@/lib/actions/alert.actions';
import { getNews, getWatchlistMarketData, searchStocks } from '@/lib/actions/finnhub.actions';
import { getWatchlistByEmail } from '@/lib/actions/watchlist.actions';

export default async function WatchlistPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    const email = session?.user.email;
    const watchlist = email ? await getWatchlistByEmail(email) : [];
    const symbols = watchlist.map((item) => item.symbol);
    const [marketData, alerts, stocks, news] = await Promise.all([
        getWatchlistMarketData(watchlist),
        getAlerts(),
        searchStocks(),
        getNews(symbols).catch(() => []),
    ]);
    const symbolSet = new Set(symbols);
    const initialStocks = stocks.map((stock) => ({ ...stock, isInWatchlist: symbolSet.has(stock.symbol) }));
    return <WatchlistDashboard watchlist={marketData} alerts={alerts} news={news} stocks={initialStocks} />;
}
