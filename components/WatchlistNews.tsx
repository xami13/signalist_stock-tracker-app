import { formatTimeAgo } from '@/lib/utils';

export default function WatchlistNews({ news = [] }: WatchlistNewsProps) {
    if (news.length === 0) return <p className="text-gray-500">No market news is available right now.</p>;
    return <div className="watchlist-news">{news.slice(0, 6).map((article) => <article className="news-item" key={`${article.id}-${article.url}`}><span className="news-tag">{article.related || article.category}</span><h3 className="news-title">{article.headline}</h3><div className="news-meta"><span>{article.source}</span><span className="mx-2">•</span><span>{formatTimeAgo(article.datetime)}</span></div><p className="news-summary">{article.summary}</p><a href={article.url} target="_blank" rel="noreferrer" className="news-cta">Read More →</a></article>)}</div>;
}
