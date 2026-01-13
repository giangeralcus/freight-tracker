import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DollarSign,
  RefreshCw,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,

  Save,
} from 'lucide-react';
import { api } from '../api/client';
import { Card, CardHeader } from '../components/ui/Card';
import { formatNumber, formatDate, cn } from '../utils/format';
import type { Currency, ExchangeRate, RateSource } from '../types';

const RATE_SOURCES: { value: RateSource; label: string; color: string }[] = [
  { value: 'BI', label: 'Bank Indonesia', color: 'bg-blue-100 text-blue-800' },
  { value: 'BCA', label: 'BCA', color: 'bg-green-100 text-green-800' },
  { value: 'MANDIRI', label: 'Mandiri', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'MANUAL', label: 'Manual', color: 'bg-gray-100 text-gray-800' },
];

export function CurrencyPage() {
  const queryClient = useQueryClient();
  const [selectedSource, setSelectedSource] = useState<RateSource | 'ALL'>('ALL');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRate, setNewRate] = useState({
    from_currency: 'USD',
    to_currency: 'IDR',
    rate: '',
    rate_buy: '',
    rate_sell: '',
    source: 'MANUAL' as RateSource,
    source_reference: '',
    notes: '',
  });

  // Fetch currencies
  const { data: currencies } = useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      const { data } = await api.get<Currency[]>('/api/currencies?active=true');
      return data;
    },
  });

  // Fetch current rates
  const { data: currentRates, isLoading: loadingRates } = useQuery({
    queryKey: ['exchange-rates-current', selectedSource],
    queryFn: async () => {
      const url = selectedSource === 'ALL'
        ? '/api/exchange-rates/current'
        : `/api/exchange-rates/current?source=${selectedSource}`;
      const { data } = await api.get<ExchangeRate[]>(url);
      return data;
    },
  });

  // Fetch rate history
  const { data: rateHistory } = useQuery({
    queryKey: ['exchange-rates-history'],
    queryFn: async () => {
      const { data } = await api.get<ExchangeRate[]>('/api/exchange-rates/history?from_currency=USD&to_currency=IDR&limit=12');
      return data;
    },
  });

  // Mutation for adding rate
  const addRateMutation = useMutation({
    mutationFn: async (rateData: typeof newRate) => {
      const { data } = await api.post('/api/exchange-rates', {
        ...rateData,
        rate: parseFloat(rateData.rate),
        rate_buy: rateData.rate_buy ? parseFloat(rateData.rate_buy) : null,
        rate_sell: rateData.rate_sell ? parseFloat(rateData.rate_sell) : null,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-rates-current'] });
      queryClient.invalidateQueries({ queryKey: ['exchange-rates-history'] });
      setShowAddForm(false);
      setNewRate({
        from_currency: 'USD',
        to_currency: 'IDR',
        rate: '',
        rate_buy: '',
        rate_sell: '',
        source: 'MANUAL',
        source_reference: '',
        notes: '',
      });
    },
  });

  // Get week info
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // Sunday

  const weekNumber = Math.ceil(
    ((today.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7
  );

  // Group rates by currency pair
  const groupedRates = currentRates?.reduce((acc, rate) => {
    const key = `${rate.from_currency}-${rate.to_currency}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(rate);
    return acc;
  }, {} as Record<string, ExchangeRate[]>);

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Currency & Exchange Rates</h1>
          <p className="text-gray-500">
            Manage weekly exchange rates from multiple sources
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Rate
        </button>
      </div>

      {/* Week Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">
                Week {weekNumber}, {today.getFullYear()}
              </p>
              <p className="text-sm text-blue-700">
                {formatDate(weekStart.toISOString())} - {formatDate(weekEnd.toISOString())}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-700">Rates are locked weekly</p>
            <p className="text-xs text-blue-600">Update every Monday</p>
          </div>
        </div>
      </div>

      {/* Source Filter */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSelectedSource('ALL')}
          className={cn(
            'px-4 py-2 rounded-lg font-medium transition-colors',
            selectedSource === 'ALL'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          All Sources
        </button>
        {RATE_SOURCES.map((source) => (
          <button
            key={source.value}
            onClick={() => setSelectedSource(source.value)}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors',
              selectedSource === source.value
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {source.label}
          </button>
        ))}
      </div>

      {/* Add Rate Form */}
      {showAddForm && (
        <Card className="mb-6">
          <CardHeader title="Add New Exchange Rate" description="Enter rate for current week" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">From Currency</label>
              <select
                className="input"
                value={newRate.from_currency}
                onChange={(e) => setNewRate({ ...newRate, from_currency: e.target.value })}
              >
                {currencies?.filter(c => !c.is_base).map((c) => (
                  <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">To Currency</label>
              <select
                className="input"
                value={newRate.to_currency}
                onChange={(e) => setNewRate({ ...newRate, to_currency: e.target.value })}
              >
                {currencies?.map((c) => (
                  <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Source</label>
              <select
                className="input"
                value={newRate.source}
                onChange={(e) => setNewRate({ ...newRate, source: e.target.value as RateSource })}
              >
                {RATE_SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Rate (Middle)</label>
              <input
                type="number"
                className="input"
                placeholder="e.g., 15800"
                value={newRate.rate}
                onChange={(e) => setNewRate({ ...newRate, rate: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Rate Buy (Optional)</label>
              <input
                type="number"
                className="input"
                placeholder="Bank buy rate"
                value={newRate.rate_buy}
                onChange={(e) => setNewRate({ ...newRate, rate_buy: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Rate Sell (Optional)</label>
              <input
                type="number"
                className="input"
                placeholder="Bank sell rate"
                value={newRate.rate_sell}
                onChange={(e) => setNewRate({ ...newRate, rate_sell: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Reference</label>
              <input
                type="text"
                className="input"
                placeholder="e.g., BCA TT Counter"
                value={newRate.source_reference}
                onChange={(e) => setNewRate({ ...newRate, source_reference: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Notes</label>
              <input
                type="text"
                className="input"
                placeholder="Optional notes"
                value={newRate.notes}
                onChange={(e) => setNewRate({ ...newRate, notes: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setShowAddForm(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={() => addRateMutation.mutate(newRate)}
              disabled={!newRate.rate || addRateMutation.isPending}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {addRateMutation.isPending ? 'Saving...' : 'Save Rate'}
            </button>
          </div>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Rates */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Current Week Rates"
              description="Active exchange rates for this week"
              action={
                <button
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['exchange-rates-current'] })}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              }
            />
            {loadingRates ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-lg" />
                ))}
              </div>
            ) : groupedRates && Object.keys(groupedRates).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(groupedRates).map(([pair, rates]) => (
                  <div key={pair} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-900">{pair.replace('-', ' → ')}</span>
                      </div>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {rates.map((rate) => {
                        const sourceInfo = RATE_SOURCES.find(s => s.value === rate.source);
                        return (
                          <div key={rate.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <span className={cn('px-2 py-1 text-xs rounded-full font-medium', sourceInfo?.color)}>
                                {sourceInfo?.label}
                              </span>
                              {rate.source_reference && (
                                <span className="text-sm text-gray-500">{rate.source_reference}</span>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-mono text-lg font-semibold text-gray-900">
                                {formatNumber(parseFloat(rate.rate.toString()))}
                              </p>
                              {(rate.rate_buy || rate.rate_sell) && (
                                <p className="text-xs text-gray-500">
                                  Buy: {rate.rate_buy ? formatNumber(parseFloat(rate.rate_buy.toString())) : '-'} |
                                  Sell: {rate.rate_sell ? formatNumber(parseFloat(rate.rate_sell.toString())) : '-'}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <DollarSign className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p>No rates found for selected source</p>
              </div>
            )}
          </Card>
        </div>

        {/* Rate History Chart (USD/IDR) */}
        <div>
          <Card>
            <CardHeader title="USD/IDR History" description="Last 12 weeks trend" />
            {rateHistory && rateHistory.length > 0 ? (
              <div className="space-y-3">
                {rateHistory.slice(0, 8).map((rate, index) => {
                  const change = index < rateHistory.length - 1
                    ? parseFloat(rate.rate.toString()) - parseFloat(rateHistory[index + 1]?.rate?.toString() || '0')
                    : 0;
                  const changePercent = index < rateHistory.length - 1 && rateHistory[index + 1]?.rate
                    ? ((change / parseFloat(rateHistory[index + 1].rate.toString())) * 100).toFixed(2)
                    : '0';

                  return (
                    <div key={rate.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Week {rate.week_number}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(rate.valid_from)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-semibold text-gray-900">
                          {formatNumber(parseFloat(rate.rate.toString()))}
                        </p>
                        {change !== 0 && (
                          <p className={cn(
                            'text-xs flex items-center justify-end gap-1',
                            change > 0 ? 'text-red-600' : 'text-green-600'
                          )}>
                            {change > 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : change < 0 ? (
                              <TrendingDown className="w-3 h-3" />
                            ) : (
                              <Minus className="w-3 h-3" />
                            )}
                            {change > 0 ? '+' : ''}{parseFloat(changePercent)}%
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="text-sm">No history data</p>
              </div>
            )}
          </Card>

          {/* Quick Converter */}
          <Card className="mt-6">
            <CardHeader title="Quick Convert" description="Convert between currencies" />
            <QuickConverter currencies={currencies || []} />
          </Card>
        </div>
      </div>
    </div>
  );
}

// Quick Converter Component
function QuickConverter({ currencies }: { currencies: Currency[] }) {
  const [amount, setAmount] = useState('1000');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('IDR');
  const [result, setResult] = useState<number | null>(null);
  const [rate, setRate] = useState<number | null>(null);

  const convert = async () => {
    try {
      const { data } = await api.post('/api/exchange-rates/convert', {
        amount: parseFloat(amount),
        from,
        to,
      });
      setResult(data.converted_amount);
      setRate(data.rate_used);
    } catch {
      setResult(null);
      setRate(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Amount</label>
        <input
          type="number"
          className="input"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">From</label>
          <select
            className="input"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>{c.code}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">To</label>
          <select
            className="input"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>{c.code}</option>
            ))}
          </select>
        </div>
      </div>
      <button onClick={convert} className="btn-primary w-full">
        Convert
      </button>
      {result !== null && (
        <div className="p-4 bg-green-50 rounded-lg text-center">
          <p className="text-sm text-green-700">Result</p>
          <p className="text-2xl font-bold text-green-900">
            {to === 'IDR' ? `Rp ${formatNumber(result)}` : formatNumber(result)}
          </p>
          {rate && (
            <p className="text-xs text-green-600 mt-1">
              Rate: 1 {from} = {formatNumber(rate)} {to}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
