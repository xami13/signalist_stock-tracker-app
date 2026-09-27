'use client';

import { useState } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { addToWatchlist, removeFromWatchlist } from '@/lib/actions/watchlist.actions';

export default function WatchlistButton({
    symbol,
    company,
    isInWatchlist: initialIsInWatchlist,
    showTrashIcon = false,
    type = 'button',
    onWatchlistChange,
}: WatchlistButtonProps) {
    const [isInWatchlist, setIsInWatchlist] = useState(initialIsInWatchlist);
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = async () => {
        setIsLoading(true);
        try {
            const result = isInWatchlist
                ? await removeFromWatchlist(symbol)
                : await addToWatchlist(symbol, company);
            if (!result.success) return toast.error(result.error || 'Could not update watchlist.');
            const nextValue = !isInWatchlist;
            setIsInWatchlist(nextValue);
            onWatchlistChange?.(symbol, nextValue);
            toast.success(nextValue ? `${symbol} added to watchlist` : `${symbol} removed from watchlist`);
        } finally {
            setIsLoading(false);
        }
    };

    if (type === 'icon') {
        return (
            <button
                type="button"
                onClick={handleToggle}
                disabled={isLoading}
                className={`watchlist-icon-btn ${isInWatchlist ? 'watchlist-icon-added' : ''}`}
                aria-label={isInWatchlist ? `Remove ${company} from watchlist` : `Add ${company} to watchlist`}
            >
                <span className="watchlist-icon">
                    {showTrashIcon && isInWatchlist
                        ? <Trash2 className="trash-icon" />
                        : <Star className="star-icon" fill={isInWatchlist ? 'currentColor' : 'none'} />}
                </span>
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={handleToggle}
            disabled={isLoading}
            className={`watchlist-btn ${isInWatchlist ? 'watchlist-remove' : ''}`}
            aria-pressed={isInWatchlist}
        >
            {isLoading ? 'Updating…' : isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
        </button>
    );
}
