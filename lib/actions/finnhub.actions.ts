'use server';

import { formatArticle, getDateRange, validateArticle } from '@/lib/utils';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const NEXT_PUBLIC_FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
const MAX_ARTICLES = 6;

async function fetchJSON(url: string, revalidateSeconds?: number): Promise<RawNewsArticle[]> {
    const response = await fetch(url, revalidateSeconds === undefined
        ? { cache: 'no-store' }
        : { cache: 'force-cache', next: { revalidate: revalidateSeconds } });

    if (!response.ok) throw new Error(`Finnhub request failed: ${response.status}`);
    const data: unknown = await response.json();
    if (!Array.isArray(data)) throw new Error('Invalid Finnhub news response');
    return data as RawNewsArticle[];
}

async function getGeneralNews(): Promise<MarketNewsArticle[]> {
    const url = new URL(`${FINNHUB_BASE_URL}/news`);
    url.searchParams.set('category', 'general');
    url.searchParams.set('token', NEXT_PUBLIC_FINNHUB_API_KEY!);

    const articles = await fetchJSON(url.toString());
    const seen = new Set<string>();
    return articles.filter(validateArticle).filter((article) => {
        const keys = [`id:${article.id}`, `url:${article.url}`, `headline:${article.headline?.trim().toLowerCase()}`];
        if (keys.some((key) => seen.has(key))) return false;
        keys.forEach((key) => seen.add(key));
        return true;
    }).slice(0, MAX_ARTICLES).map((article, index) => formatArticle(article, false, undefined, index));
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
            return { symbol, articles: (await fetchJSON(url.toString())).filter(validateArticle) };
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
        console.error('Error fetching news:', error);
        throw new Error('Failed to fetch news');
    }
}
