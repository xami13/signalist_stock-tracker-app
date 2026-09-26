import TradingViewWidget from "@/components/TradingViewWidget";
import WatchlistButton from "@/components/WatchlistButton";
import {
    BASELINE_WIDGET_CONFIG,
    CANDLE_CHART_WIDGET_CONFIG,
    COMPANY_FINANCIALS_WIDGET_CONFIG,
    COMPANY_PROFILE_WIDGET_CONFIG,
    SYMBOL_INFO_WIDGET_CONFIG,
    TECHNICAL_ANALYSIS_WIDGET_CONFIG,
} from "@/lib/constants";

const StockDetails = async ({ params }: StockDetailsPageProps) => {
    const { symbol } = await params;
    const upperSymbol = symbol.toUpperCase();

    const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column */}
            <section className="flex flex-col gap-6">
                <TradingViewWidget
                    scriptUrl={`${scriptUrl}symbol-info.js`}
                    config={SYMBOL_INFO_WIDGET_CONFIG(upperSymbol)}
                    height={170}
                />

                <TradingViewWidget
                    scriptUrl={`${scriptUrl}advanced-chart.js`}
                    config={CANDLE_CHART_WIDGET_CONFIG(upperSymbol)}
                    height={600}
                />

                <TradingViewWidget
                    scriptUrl={`${scriptUrl}advanced-chart.js`}
                    config={BASELINE_WIDGET_CONFIG(upperSymbol)}
                    height={600}
                />
            </section>

            {/* Right column */}
            <section className="flex flex-col gap-6">
                <WatchlistButton
                    symbol={upperSymbol}
                    company={upperSymbol}
                    isInWatchlist={false}
                />

                <TradingViewWidget
                    scriptUrl={`${scriptUrl}technical-analysis.js`}
                    config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(upperSymbol)}
                    height={400}
                />

                <TradingViewWidget
                    scriptUrl={`${scriptUrl}company-profile.js`}
                    config={COMPANY_PROFILE_WIDGET_CONFIG(upperSymbol)}
                    height={440}
                />

                <TradingViewWidget
                    scriptUrl={`${scriptUrl}financials.js`}
                    config={COMPANY_FINANCIALS_WIDGET_CONFIG(upperSymbol)}
                    height={464}
                />
            </section>
        </div>
    );
};

export default StockDetails;
