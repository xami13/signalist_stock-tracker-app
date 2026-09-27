'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import SearchCommand from '@/components/SearchCommand';
import WatchlistTable from '@/components/WatchlistTable';
import AlertsList from '@/components/AlertsList';
import PriceAlertModal from '@/components/PriceAlertModal';
import WatchlistNews from '@/components/WatchlistNews';
import { removeFromWatchlist } from '@/lib/actions/watchlist.actions';

export default function WatchlistDashboard({ watchlist: initialWatchlist, alerts: initialAlerts, news, stocks }: { watchlist: StockWithData[]; alerts: PriceAlert[]; news: MarketNewsArticle[]; stocks: StockWithWatchlistStatus[] }) {
    const router = useRouter();
    const [watchlist, setWatchlist] = useState(initialWatchlist);
    const [selectedStock, setSelectedStock] = useState<SelectedStock | null>(null);
    const [editingAlert, setEditingAlert] = useState<PriceAlert | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const refresh = () => router.refresh();
    const remove = async (symbol: string) => { const result = await removeFromWatchlist(symbol); if (!result.success) return toast.error(result.error || 'Could not remove stock.'); setWatchlist((items) => items.filter((item) => item.symbol !== symbol)); toast.success(`${symbol} removed from watchlist`); refresh(); };
    const createAlert = (stock: SelectedStock) => { setEditingAlert(null); setSelectedStock(stock); setModalOpen(true); };
    const editAlert = (alert: PriceAlert) => { setEditingAlert(alert); setSelectedStock(null); setModalOpen(true); };
    const createFromFirstStock = () => { const stock = watchlist[0]; if (!stock) return toast.info('Add a stock before creating an alert.'); createAlert({ symbol: stock.symbol, company: stock.company, currentPrice: stock.currentPrice }); };
    const logos = Object.fromEntries(watchlist.filter((stock) => stock.logo).map((stock) => [stock.symbol, stock.logo as string]));

    return <div className="space-y-10"><div className="watchlist-container"><section className="watchlist"><div className="flex items-center justify-between gap-4"><h1 className="watchlist-title">Watchlist</h1><SearchCommand renderAs="button" label="Add Stock" initialStocks={stocks} /></div>{watchlist.length ? <WatchlistTable watchlist={watchlist} onCreateAlert={createAlert} onRemove={remove} /> : <div className="watchlist-empty-container"><div className="watchlist-empty"><h2 className="empty-title">Your watchlist is empty</h2><p className="empty-description">Search for a company and select the star to start tracking it.</p><SearchCommand renderAs="button" label="Add your first stock" initialStocks={stocks} /></div></div>}</section><aside className="watchlist-alerts"><div className="flex w-full items-center justify-between gap-4"><h2 className="watchlist-title">Alerts</h2><button type="button" onClick={createFromFirstStock} className="search-btn">Create Alert</button></div><AlertsList alerts={initialAlerts} logos={logos} onEdit={editAlert} onDeleted={refresh} /></aside></div><section className="space-y-5"><h2 className="watchlist-title">News</h2><WatchlistNews news={news} /></section><PriceAlertModal open={modalOpen} onOpenChange={setModalOpen} stock={selectedStock} alert={editingAlert} onSaved={refresh} /></div>;
}
