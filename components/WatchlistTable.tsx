import { WATCHLIST_TABLE_HEADER } from '@/lib/constants';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

const watchlist = [
    ['Apple Inc.', 'AAPL', '$227.16', '+1.25%', '$3.43T', '34.52', 'Above $230', 'Remove'],
    ['Microsoft Corp.', 'MSFT', '$416.32', '-0.48%', '$3.09T', '35.18', 'Below $400', 'Remove'],
    ['NVIDIA Corp.', 'NVDA', '$141.97', '+2.31%', '$3.48T', '55.91', 'Above $145', 'Remove'],
];

export default function WatchlistTable() {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    {WATCHLIST_TABLE_HEADER.map((header) => (
                        <TableHead key={header} className="text-left">
                            {header}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {watchlist.map((row) => (
                    <TableRow key={row[1]}>
                        {row.map((value, index) => (
                            <TableCell key={WATCHLIST_TABLE_HEADER[index]} className="text-left">
                                {value}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
