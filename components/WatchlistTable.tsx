'use client';

import { Star } from 'lucide-react';
import { WATCHLIST_TABLE_HEADER } from '@/lib/constants';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function WatchlistTable({ watchlist, onCreateAlert, onRemove }: WatchlistTableProps) {
    return <div className="watchlist-table"><Table><TableHeader><TableRow className="table-header-row"><TableHead className="w-12" />{WATCHLIST_TABLE_HEADER.filter((header) => header !== 'Action').map((header) => <TableHead key={header} className="table-header text-left">{header}</TableHead>)}</TableRow></TableHeader><TableBody>{watchlist.map((stock) => <TableRow key={stock.symbol} className="table-row"><TableCell><button type="button" onClick={() => onRemove?.(stock.symbol)} className="watchlist-icon watchlist-icon-added" aria-label={`Remove ${stock.company}`}><Star className="star-icon" fill="currentColor" /></button></TableCell><TableCell className="table-cell max-w-44 truncate">{stock.company}</TableCell><TableCell className="table-cell">{stock.symbol}</TableCell><TableCell className="table-cell">{stock.priceFormatted || '—'}</TableCell><TableCell className={`table-cell ${(stock.changePercent || 0) >= 0 ? 'text-teal-400' : 'text-red-500'}`}>{stock.changeFormatted || '—'}</TableCell><TableCell className="table-cell">{stock.marketCap || '—'}</TableCell><TableCell className="table-cell">{stock.peRatio || '—'}</TableCell><TableCell><button type="button" className="add-alert" onClick={() => onCreateAlert?.({ symbol: stock.symbol, company: stock.company, currentPrice: stock.currentPrice })}>Add Alert</button></TableCell></TableRow>)}</TableBody></Table></div>;
}
