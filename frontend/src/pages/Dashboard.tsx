import { useQuery } from '@tanstack/react-query';
import {
  Ship,
  MessageSquare,
  FileText,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { api } from '../api/client';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader } from '../components/ui/Card';
import { formatUSD, formatDate, getStatusColor, cn } from '../utils/format';
import type { DashboardSummary, MonthlyProfit, Shipment } from '../types';

export function Dashboard() {
  // Fetch dashboard summary
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const { data } = await api.get<DashboardSummary>('/api/dashboard/summary');
      return data;
    },
  });

  // Fetch recent shipments
  const { data: recentShipments, isLoading: loadingShipments } = useQuery({
    queryKey: ['recent-shipments'],
    queryFn: async () => {
      const { data } = await api.get<Shipment[]>('/api/shipments?limit=5');
      return data;
    },
  });

  // Fetch monthly profit
  const { data: monthlyProfit, isLoading: loadingProfit } = useQuery({
    queryKey: ['monthly-profit'],
    queryFn: async () => {
      const { data } = await api.get<MonthlyProfit[]>('/api/reports/monthly-profit?limit=6');
      return data;
    },
  });

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome back! Here's your business overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Active Shipments"
          value={summary?.active_shipments ?? '-'}
          subtitle="In progress"
          icon={Ship}
          color="blue"
        />
        <StatCard
          title="Pending Inquiries"
          value={summary?.pending_inquiries ?? '-'}
          subtitle="Awaiting quote"
          icon={MessageSquare}
          color="yellow"
        />
        <StatCard
          title="Active Quotations"
          value={summary?.active_quotes ?? '-'}
          subtitle="Sent to customers"
          icon={FileText}
          color="purple"
        />
        <StatCard
          title="Overdue Payments"
          value={summary?.overdue_payments ?? '-'}
          subtitle="Needs attention"
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Profit Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <StatCard
          title="Month-to-Date Profit"
          value={formatUSD(summary?.mtd_profit_usd ?? 0)}
          subtitle="This month"
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Year-to-Date Profit"
          value={formatUSD(summary?.ytd_profit_usd ?? 0)}
          subtitle="This year"
          icon={DollarSign}
          color="green"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Shipments */}
        <Card>
          <CardHeader
            title="Recent Shipments"
            description="Latest shipment activity"
            action={
              <a href="/shipments" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </a>
            }
          />
          {loadingShipments ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg" />
              ))}
            </div>
          ) : recentShipments?.length ? (
            <div className="space-y-4">
              {recentShipments.map((shipment) => (
                <div
                  key={shipment.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-medium text-gray-900">
                        {shipment.job_number}
                      </span>
                      <span className={cn('px-2 py-0.5 text-xs rounded-full font-medium', getStatusColor(shipment.status))}>
                        {shipment.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {shipment.customer_name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {shipment.pol?.code} → {shipment.pod?.code} | {shipment.container_type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">
                      {formatUSD(shipment.actual_profit_usd)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(shipment.booking_date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Ship className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>No shipments yet</p>
              <p className="text-sm">Create your first shipment to get started</p>
            </div>
          )}
        </Card>

        {/* Monthly Profit Chart */}
        <Card>
          <CardHeader
            title="Monthly Profit"
            description="Last 6 months performance"
            action={
              <a href="/reports" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                View reports <ArrowRight className="w-4 h-4" />
              </a>
            }
          />
          {loadingProfit ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg" />
              ))}
            </div>
          ) : monthlyProfit?.length ? (
            <div className="space-y-4">
              {monthlyProfit.map((month) => {
                const maxProfit = Math.max(...monthlyProfit.map(m => m.total_profit_usd));
                const width = maxProfit > 0 ? (month.total_profit_usd / maxProfit) * 100 : 0;

                return (
                  <div key={month.month} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {new Date(month.month).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="font-medium text-gray-900">
                        {formatUSD(month.total_profit_usd)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(width, 2)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>{month.shipment_count} shipments</span>
                      <span>{month.margin_percentage}% margin</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>No profit data yet</p>
              <p className="text-sm">Complete shipments to see profit trends</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
