import { useQuery } from '@tanstack/react-query';
import { Calendar, Ship, MapPin, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Schedules() {
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['shipping-schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipping_schedules')
        .select('*')
        .order('etd', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded w-48"></div>
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Shipping Schedules</h1>
        <p className="text-sm text-gray-500">Jadwal kapal dari Supabase</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-100">
        {schedules && schedules.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {schedules.map((schedule: any) => (
              <div key={schedule.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Ship className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-gray-900">
                        {schedule.vessel_name || schedule.carrier || 'TBA'}
                      </span>
                      {schedule.voyage && (
                        <span className="text-xs text-gray-400">V.{schedule.voyage}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-600">{schedule.pol}</span>
                        <span className="text-gray-300 mx-1">→</span>
                        <span className="text-gray-600">{schedule.pod}</span>
                      </div>
                      
                      {schedule.transit_time && (
                        <div className="flex items-center gap-1 text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>{schedule.transit_time} days</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-600">ETD:</span>
                      <span className="font-medium text-gray-900">
                        {schedule.etd ? new Date(schedule.etd).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                      </span>
                    </div>
                    {schedule.eta && (
                      <div className="text-xs text-gray-400 mt-1">
                        ETA: {new Date(schedule.eta).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </div>
                    )}
                  </div>
                </div>
                
                {(schedule.closing_time || schedule.remarks) && (
                  <div className="mt-2 pt-2 border-t border-gray-50 text-xs text-gray-400">
                    {schedule.closing_time && (
                      <span>Closing: {schedule.closing_time}</span>
                    )}
                    {schedule.remarks && (
                      <span className="ml-3">{schedule.remarks}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">No schedules available</p>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-xs text-gray-400 text-right">
        {schedules?.length || 0} schedules
      </div>
    </div>
  );
}
