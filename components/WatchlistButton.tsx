'use client';

import { useState } from 'react';

const WatchlistButton = ({
    symbol,
    company,
    isInWatchlist: initialIsInWatchlist,
}: WatchlistButtonProps) => {
    const [isInWatchlist, setIsInWatchlist] = useState(initialIsInWatchlist);
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = async () => {
        setIsLoading(true);
        try {
            // Placeholder toggle — wire to server action in the next step.
            setIsInWatchlist((prev) => !prev);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleToggle}
            disabled={isLoading}
            className={`watchlist-btn ${isInWatchlist ? 'watchlist-remove' : ''}`}
            aria-pressed={isInWatchlist}
            aria-label={isInWatchlist ? `Remove ${company} from watchlist` : `Add ${company} to watchlist`}
        >
            {isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
        </button>
    );
};

export default WatchlistButton;
