import { useQuery } from '@tanstack/react-query';
import { Ship, FileText, DollarSign, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { StatCard } from '../components/ui/StatCard';

export function Dashboard() {
  const { data: quotations, isLoading: loadingQuotes } = useQuery({
    queryKey: ['supabase-quotations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: schedules, isLoading: loadingSchedules } = useQuery({
    queryKey: ['supabase-schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipping_schedules')
        .select('*')
        .order('etd', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const isLoading = loadingQuotes || loadingSchedules;
  const activeQuotes = quotations?.filter(q => q.status !== 'draft').length ?? 0;
  const totalMargin = quotations?.reduce((sum, q) => sum + (parseFloat(q.margin) || 0), 0) ?? 0;
  const upcomingSchedules = schedules?.length ?? 0;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded w-48"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-24 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const avgMargin = (totalMargin / (quotations?.length || 1)).toFixed(1);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Internal freight tracking overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Quotations" value={quotations?.length ?? 0} icon={FileText} change={activeQuotes + ' active'} />
        <StatCard title="Schedules" value={upcomingSchedules} icon={Calendar} change="Upcoming" />
        <StatCard title="Avg Margin" value={avgMargin + '%'} icon={DollarSign} change="From quotations" />
        <StatCard title="Shipments" value={0} icon={Ship} change="In progress" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Quotations</h3>
          <div className="space-y-2 text-sm">
            {quotations && quotations.length > 0 ? (
              quotations.slice(0, 5).map((q) => (
                <div key={q.id} className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0">
                  <div>
                    <span className="text-gray-900 font-medium">{q.quote_number}</span>
                    <span className="text-gray-400 ml-2">{q.customer_name}</span>
                  </div>
                  <span className={getStatusClass(q.status)}>{q.status}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No quotations yet</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Shipping Schedules</h3>
          <div className="space-y-2 text-sm">
            {schedules && schedules.length > 0 ? (
              schedules.slice(0, 5).map((s) => (
                <div key={s.id} className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0">
                  <div>
                    <span className="text-gray-900 font-medium">{s.vessel_name || s.carrier}</span>
                    <span className="text-gray-400 ml-2">{s.pol} - {s.pod}</span>
                  </div>
                  <span className="text-xs text-gray-500">{s.etd ? new Date(s.etd).toLocaleDateString() : '-'}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No schedules yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getStatusClass(status: string) {
  const base = 'text-xs px-2 py-0.5 rounded';
  if (status === 'accepted') return base + ' bg-green-50 text-green-700';
  if (status === 'sent') return base + ' bg-blue-50 text-blue-700';
  return base + ' bg-gray-50 text-gray-600';
}
