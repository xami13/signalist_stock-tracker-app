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
    const submit = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); setSaving(true); try { const result = await saveAlert({ id: alert?.id, symbol: stock.symbol, company: stock.company, alertName, alertType, threshold, frequency }); if (!result.success) return toast.error(result.error || 'Could not save alert.'); toast.success(alert ? 'Alert updated' : 'Price alert created'); close(); onSaved(); } finally { setSaving(false); } };
    return <form onSubmit={submit} className="space-y-6 p-7 sm:p-10"><DialogHeader><DialogTitle className="alert-title">Price Alert</DialogTitle><DialogDescription className="sr-only">Create or update a stock price alert.</DialogDescription></DialogHeader><label className="block space-y-2"><span className="form-label">Alert Name</span><input required value={alertName} onChange={(event) => setAlertName(event.target.value)} className="form-input w-full" placeholder="Apple at discount" /></label><label className="block space-y-2"><span className="form-label">Stock identifier</span><input disabled value={`${stock.company} (${stock.symbol})`} className="form-input w-full disabled:opacity-60" /></label><label className="block space-y-2"><span className="form-label">Alert type</span><input disabled value="Price" className="form-input w-full disabled:opacity-60" /></label><label className="block space-y-2"><span className="form-label">Condition</span><select value={alertType} onChange={(event) => setAlertType(event.target.value as 'upper' | 'lower')} className="form-input w-full"><option value="upper">Greater than (&gt;)</option><option value="lower">Less than (&lt;)</option></select></label><label className="block space-y-2"><span className="form-label">Threshold value</span><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-500">$</span><input required min="0.01" step="0.01" type="number" value={threshold} onChange={(event) => setThreshold(event.target.value)} className="form-input w-full pl-8" placeholder="eg: 140" /></div></label><label className="block space-y-2"><span className="form-label">Frequency</span><select value={frequency} onChange={(event) => setFrequency(event.target.value as AlertFrequency)} className="form-input w-full"><option value="minute">Once per minute</option><option value="hour">Once per hour</option><option value="day">Once per day</option></select></label><button disabled={saving} className="yellow-btn w-full" type="submit">{saving ? 'Saving…' : alert ? 'Update Alert' : 'Create Alert'}</button></form>;
}

export default function PriceAlertModal({ open, onOpenChange, stock, alert, onSaved }: { open: boolean; onOpenChange: (open: boolean) => void; stock: SelectedStock | null; alert?: PriceAlert | null; onSaved: () => void }) {
    const selectedStock = stock || (alert ? { symbol: alert.symbol, company: alert.company } : null);
    return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="alert-dialog p-0 overflow-hidden sm:max-w-xl">{selectedStock && <AlertForm key={alert?.id || selectedStock.symbol} stock={selectedStock} alert={alert} close={() => onOpenChange(false)} onSaved={onSaved} />}</DialogContent></Dialog>;
}
