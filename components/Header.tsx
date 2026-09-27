import Link from "next/link";
import Image from "next/image";
import NavItems from "@/components/NavItems";
import UserDropdown from "@/components/UserDropdown";
import {searchStocks} from "@/lib/actions/finnhub.actions";
import { getWatchlistSymbolsByEmail } from '@/lib/actions/watchlist.actions';

const Header = async ({ user }: { user: User }) => {
    const [stocks, watchlistSymbols] = await Promise.all([searchStocks(), getWatchlistSymbolsByEmail(user.email)]);
    const watched = new Set(watchlistSymbols);
    const initialStocks = stocks.map((stock) => ({ ...stock, isInWatchlist: watched.has(stock.symbol) }));
    return (
        <header className={"sticky top-0 header"}>
            <div className={"container header-wrapper"}>
                <Link href="/">
                    <Image src="/assets/icons/logo.svg" alt="Signalist logo" width={130} height={30} preload className={"h-8 w-auto cursor-pointer"} />
                </Link>
                <nav className="hidden sm:block">
                    <NavItems initialStocks={initialStocks} />
                </nav>

                <UserDropdown user={user} initialStocks={initialStocks} />

            </div>
        </header>
    )
}
export default Header
