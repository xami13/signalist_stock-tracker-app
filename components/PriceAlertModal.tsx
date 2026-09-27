'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { saveAlert } from '@/lib/actions/alert.actions';
import { toast } from 'sonner';

function AlertForm({ stock, alert, close, onSaved }: { stock: SelectedStock; alert?: PriceAlert | null; close: () => void; onSaved: () => void }) {
    const [alertName, setAlertName] = useState(alert?.alertName || `${stock.symbol} price alert`);
    const [alertType, setAlertType] = useState<'upper' | 'lower'>(alert?.alertType || 'upper');
    const [threshold, setThreshold] = useState(alert?.threshold?.toString() || stock.currentPrice?.toFixed(2) || '');
    const [frequency, setFrequency] = useState<AlertFrequency>(alert?.frequency || 'day');
    const [saving, setSaving] = useState(false);
    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        try {
            const result = await saveAlert({
                id: alert?.id,
                symbol: stock.symbol,
                company: stock.company,
                alertName,
                alertType,
                threshold,
                frequency,
            });
            if (!result.success) return toast.error(result.error || 'Could not save alert.');
            toast.success(alert ? 'Alert updated' : 'Price alert created');
            close();
            onSaved();
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-6 p-6 sm:p-8">
            <DialogHeader className="space-y-2">
                <DialogTitle className="alert-title">Price Alert</DialogTitle>
                <p className="alert-subtitle">Get notified when market shifts.</p>
                <DialogDescription className="sr-only">Create or update a stock price alert.</DialogDescription>
            </DialogHeader>

            <div className="alert-summary">
                <div className="alert-summary-item">
                    <span className="alert-summary-label">Stock</span>
                    <span className="alert-summary-value">{stock.company}</span>
                </div>
                <div className="alert-summary-item">
                    <span className="alert-summary-label">Symbol</span>
                    <span className="alert-summary-value text-yellow-500">{stock.symbol}</span>
                </div>
            </div>

            <div className="alert-section">
                <label className="form-label" htmlFor="alert-name">Alert Name</label>
                <input
                    id="alert-name"
                    required
                    value={alertName}
                    onChange={(event) => setAlertName(event.target.value)}
                    className="form-input w-full"
                    placeholder="Apple at discount"
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="alert-section">
                    <label className="form-label" htmlFor="alert-condition">Condition</label>
                    <select
                        id="alert-condition"
                        value={alertType}
                        onChange={(event) => setAlertType(event.target.value as 'upper' | 'lower')}
                        className="form-input w-full"
                    >
                        <option value="upper">Price &gt; threshold</option>
                        <option value="lower">Price &lt; threshold</option>
                    </select>
                </div>
                <div className="alert-section">
                    <label className="form-label" htmlFor="alert-frequency">Frequency</label>
                    <select
                        id="alert-frequency"
                        value={frequency}
                        onChange={(event) => setFrequency(event.target.value as AlertFrequency)}
                        className="form-input w-full"
                    >
                        <option value="minute">Once per minute</option>
                        <option value="hour">Once per hour</option>
                        <option value="day">Once per day</option>
                    </select>
                </div>
            </div>

            <div className="alert-section">
                <label className="form-label" htmlFor="alert-threshold">Threshold price</label>
                <div className="relative">
                    <span className="input-prefix">$</span>
                    <input
                        id="alert-threshold"
                        required
                        min="0.01"
                        step="0.01"
                        inputMode="decimal"
                        type="text"
                        value={threshold}
                        onChange={(event) => setThreshold(event.target.value)}
                        className="threshold-input w-full"
                        placeholder="0.00"
                    />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">Current price: ${stock.currentPrice?.toFixed(2) ?? '—'}</p>
            </div>

            <button disabled={saving} className="yellow-btn w-full" type="submit">
                {saving ? 'Saving…' : alert ? 'Update Alert' : 'Create Alert'}
            </button>
        </form>
    );
}

export default function PriceAlertModal({
    open,
    onOpenChange,
    stock,
    alert,
    watchlist,
    onSaved,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    stock: SelectedStock | null;
    alert?: PriceAlert | null;
    watchlist?: StockWithData[];
    onSaved: () => void;
}) {
    const selectedStock: SelectedStock | null = stock
        || (alert
            ? {
                symbol: alert.symbol,
                company: alert.company,
                currentPrice: watchlist?.find((item) => item.symbol === alert.symbol)?.currentPrice,
            }
            : null);
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="alert-dialog p-0 overflow-hidden sm:max-w-md">
                {selectedStock && (
                    <AlertForm
                        key={alert?.id || selectedStock.symbol}
                        stock={selectedStock}
                        alert={alert}
                        close={() => onOpenChange(false)}
                        onSaved={onSaved}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
