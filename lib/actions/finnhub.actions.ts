'use server';

import { cache } from 'react';
import { POPULAR_STOCK_SYMBOLS } from '@/lib/constants';
import {
    formatArticle,
    formatChangePercent,
    formatMarketCapValue,
    formatPrice,
    getDateRange,
    validateArticle,
} from '@/lib/utils';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const NEXT_PUBLIC_FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
const MAX_ARTICLES = 6;

class FinnhubRateLimitError extends Error {
    constructor() {
        super('Finnhub rate limit reached');
        this.name = 'FinnhubRateLimitError';
    }
}

const POPULAR_STOCK_NAMES: Record<string, string> = {
    AAPL: 'Apple Inc.',
    MSFT: 'Microsoft Corporation',
    GOOGL: 'Alphabet Inc.',
    AMZN: 'Amazon.com Inc.',
    TSLA: 'Tesla Inc.',
    META: 'Meta Platforms Inc.',
    NVDA: 'NVIDIA Corporation',
    NFLX: 'Netflix Inc.',
    ORCL: 'Oracle Corporation',
    CRM: 'Salesforce Inc.',
};


async function getGeneralNews(): Promise<MarketNewsArticle[]> {
    const url = new URL(`${FINNHUB_BASE_URL}/news`);
    url.searchParams.set('category', 'general');
    url.searchParams.set('token', NEXT_PUBLIC_FINNHUB_API_KEY!);

    const response = await fetchJSON<unknown>(url.toString());
    const articles = Array.isArray(response) ? response as RawNewsArticle[] : [];
    const seen = new Set<string>();
    return articles.filter(validateArticle).filter((article) => {
        const keys = [`id:${article.id}`, `url:${article.url}`, `headline:${article.headline?.trim().toLowerCase()}`];
        if (keys.some((key) => seen.has(key))) return false;
        keys.forEach((key) => seen.add(key));
        return true;
    }).slice(0, MAX_ARTICLES).map((article, index) => formatArticle(article, false, undefined, index));
}

type FinnhubProfile = {
    name?: string;
    exchange?: string;
    marketCapitalization?: number;
    logo?: string;
};

type FinnhubFinancials = {
    metric?: {
        peNormalizedAnnual?: number;
        peBasicExclExtraTTM?: number;
    };
};

export async function fetchJSON<T>(url: string, revalidateSeconds?: number): Promise<T> {
    const response = await fetch(url, revalidateSeconds === undefined
        ? { cache: 'no-store' }
        : { cache: 'force-cache', next: { revalidate: revalidateSeconds } });

    if (response.status === 429) throw new FinnhubRateLimitError();
    if (!response.ok) throw new Error(`Finnhub request failed: ${response.status}`);
    const data: unknown = await response.json();
    return data as T;
}

export const searchStocks = cache(async (query?: string): Promise<StockWithWatchlistStatus[]> => {
    try {
        if (!NEXT_PUBLIC_FINNHUB_API_KEY) throw new Error('NEXT_PUBLIC_FINNHUB_API_KEY is missing');

        let results: FinnhubSearchResult[] = [];
        const trimmed = query?.trim();

        if (!trimmed) {
            results = POPULAR_STOCK_SYMBOLS.slice(0, 10).map((symbol) => ({
                symbol,
                description: POPULAR_STOCK_NAMES[symbol] ?? symbol,
                displaySymbol: symbol,
                type: 'Common Stock',
            }));
        } else {
            const url = new URL(`${FINNHUB_BASE_URL}/search`);
            url.searchParams.set('q', encodeURIComponent(trimmed));
            url.searchParams.set('token', NEXT_PUBLIC_FINNHUB_API_KEY);

            const response = await fetchJSON<FinnhubSearchResponse>(url.toString(), 1800);
            results = Array.isArray(response.result) ? response.result : [];
        }

        return results.slice(0, 15).map((result): StockWithWatchlistStatus => ({
            symbol: result.symbol.toUpperCase(),
            name: result.description,
            exchange: result.displaySymbol ?? 'US',
            type: result.type || 'Stock',
            isInWatchlist: false,
        }));
    } catch (error) {
        if (!(error instanceof FinnhubRateLimitError)) console.error('Error in stock search:', error);
        return [];
    }
});

export async function getWatchlistMarketData(items: StockWithData[]): Promise<StockWithData[]> {
    if (!NEXT_PUBLIC_FINNHUB_API_KEY || items.length === 0) return items;

    return Promise.all(items.map(async (item) => {
        try {
            const quoteUrl = new URL(`${FINNHUB_BASE_URL}/quote`);
            quoteUrl.searchParams.set('symbol', item.symbol);
            quoteUrl.searchParams.set('token', NEXT_PUBLIC_FINNHUB_API_KEY);
            const profileUrl = new URL(`${FINNHUB_BASE_URL}/stock/profile2`);
            profileUrl.searchParams.set('symbol', item.symbol);
            profileUrl.searchParams.set('token', NEXT_PUBLIC_FINNHUB_API_KEY);
            const financialsUrl = new URL(`${FINNHUB_BASE_URL}/stock/metric`);
            financialsUrl.searchParams.set('symbol', item.symbol);
            financialsUrl.searchParams.set('metric', 'all');
            financialsUrl.searchParams.set('token', NEXT_PUBLIC_FINNHUB_API_KEY);

            const [quote, profile, financials] = await Promise.all([
                fetchJSON<QuoteData>(quoteUrl.toString()),
                fetchJSON<FinnhubProfile>(profileUrl.toString(), 3600),
                fetchJSON<FinnhubFinancials>(financialsUrl.toString(), 3600),
            ]);
            const currentPrice = quote.c;
            const changePercent = quote.dp;
            const marketCapMillions = profile.marketCapitalization;
            const peRatio = financials.metric?.peNormalizedAnnual ?? financials.metric?.peBasicExclExtraTTM;

            return {
                ...item,
                company: profile.name || item.company,
                currentPrice,
                changePercent,
                priceFormatted: currentPrice ? formatPrice(currentPrice) : '—',
                changeFormatted: typeof changePercent === 'number' ? formatChangePercent(changePercent) : '—',
                marketCap: marketCapMillions ? formatMarketCapValue(marketCapMillions * 1_000_000) : '—',
                peRatio: peRatio ? peRatio.toFixed(1) : '—',
                logo: profile.logo || '',
            };
        } catch (error) {
            if (!(error instanceof FinnhubRateLimitError)) console.error(`Error fetching market data for ${item.symbol}:`, error);
            return { ...item, priceFormatted: '—', changeFormatted: '—', marketCap: '—', peRatio: '—' };
        }
    }));
}

export async function getNews(symbols?: string[]): Promise<MarketNewsArticle[]> {
    try {
        if (!NEXT_PUBLIC_FINNHUB_API_KEY) throw new Error('NEXT_PUBLIC_FINNHUB_API_KEY is missing');

        const cleanedSymbols = [...new Set((symbols || []).map((symbol) => symbol.trim().toUpperCase()).filter(Boolean))];
        if (cleanedSymbols.length === 0) return getGeneralNews();

        const { from, to } = getDateRange(5);
        const newsBySymbol = await Promise.all(cleanedSymbols.slice(0, MAX_ARTICLES).map(async (symbol) => {
            const url = new URL(`${FINNHUB_BASE_URL}/company-news`);
            url.searchParams.set('symbol', symbol);
            url.searchParams.set('from', from);
            url.searchParams.set('to', to);
            url.searchParams.set('token', NEXT_PUBLIC_FINNHUB_API_KEY);
            const response = await fetchJSON<unknown>(url.toString());
            const articles = Array.isArray(response) ? response as RawNewsArticle[] : [];
            return { symbol, articles: articles.filter(validateArticle) };
        }));

        const result: MarketNewsArticle[] = [];
        const seen = new Set<string>();
        const positions = new Array<number>(newsBySymbol.length).fill(0);
        for (let round = 0; round < MAX_ARTICLES; round++) {
            const groupIndex = round % newsBySymbol.length;
            const group = newsBySymbol[groupIndex];
            while (positions[groupIndex] < group.articles.length) {
                const article = group.articles[positions[groupIndex]++];
                const keys = [`id:${article.id}`, `url:${article.url}`, `headline:${article.headline?.trim().toLowerCase()}`];
                if (keys.some((key) => seen.has(key))) continue;
                keys.forEach((key) => seen.add(key));
                result.push(formatArticle(article, true, group.symbol));
                break;
            }
        }

        if (result.length === 0) return getGeneralNews();
        return result.sort((a, b) => b.datetime - a.datetime);
    } catch (error) {
        if (!(error instanceof FinnhubRateLimitError)) console.error('Error fetching news:', error);
        throw new Error('Failed to fetch news');
    }
}


