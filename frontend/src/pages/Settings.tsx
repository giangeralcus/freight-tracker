import { useQuery } from '@tanstack/react-query';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { api } from '../api/client';
import { Card, CardHeader } from '../components/ui/Card';
import type { Setting } from '../types';

export function Settings() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get<Setting[]>('/api/settings');
      return data;
    },
  });

  const getSettingValue = (key: string) => {
    return settings?.find((s) => s.key === key)?.value ?? '';
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Configure exchange rates, defaults, and company information.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Currency Settings */}
        <Card>
          <CardHeader title="Currency Settings" description="Exchange rates and currency defaults" />
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-100 rounded-lg" />
              <div className="h-10 bg-gray-100 rounded-lg" />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="label">USD to IDR Exchange Rate</label>
                <input
                  type="number"
                  className="input"
                  defaultValue={getSettingValue('exchange_rate_usd_idr')}
                  placeholder="e.g., 15800"
                />
              </div>
              <div>
                <label className="label">Default Markup Percentage</label>
                <input
                  type="number"
                  className="input"
                  defaultValue={getSettingValue('default_markup_percent')}
                  placeholder="e.g., 15"
                />
              </div>
              <div>
                <label className="label">VAT Rate (%)</label>
                <input
                  type="number"
                  className="input"
                  defaultValue={getSettingValue('vat_rate_percent')}
                  placeholder="e.g., 11"
                />
              </div>
            </div>
          )}
        </Card>

        {/* Company Information */}
        <Card>
          <CardHeader title="Company Information" description="Your company details for documents" />
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-100 rounded-lg" />
              <div className="h-10 bg-gray-100 rounded-lg" />
              <div className="h-10 bg-gray-100 rounded-lg" />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="label">Company Name</label>
                <input
                  type="text"
                  className="input"
                  defaultValue={getSettingValue('company_name')}
                  placeholder="Company name"
                />
              </div>
              <div>
                <label className="label">Address</label>
                <textarea
                  className="input"
                  rows={2}
                  defaultValue={getSettingValue('company_address')}
                  placeholder="Company address"
                />
              </div>
              <div>
                <label className="label">Phone</label>
                <input
                  type="text"
                  className="input"
                  defaultValue={getSettingValue('company_phone')}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  defaultValue={getSettingValue('company_email')}
                  placeholder="Email address"
                />
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button className="btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save Settings
        </button>
      </div>
    </div>
  );
}
