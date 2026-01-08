import { useQuery } from '@tanstack/react-query';
import { Building2, Plus, Search } from 'lucide-react';
import { api } from '../api/client';
import { Card } from '../components/ui/Card';
import type { Vendor } from '../types';

export function Vendors() {
  const { data: vendors, isLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const { data } = await api.get<Vendor[]>('/api/vendors');
      return data;
    },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-500">Manage coloaders, shipping lines, and airlines.</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Vendor
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search vendors..."
            className="input pl-10"
          />
        </div>
      </div>

      {/* Vendor List */}
      <Card>
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg" />
            ))}
          </div>
        ) : vendors?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Code</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">City</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Payment Terms</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-sm">{vendor.code}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{vendor.name}</p>
                        {vendor.email && (
                          <p className="text-sm text-gray-500">{vendor.email}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">
                        {vendor.vendor_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{vendor.city || '-'}</td>
                    <td className="py-3 px-4 text-gray-600">{vendor.payment_terms} days</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        vendor.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {vendor.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <Building2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors yet</h3>
            <p className="text-gray-500 mb-4">Add your first vendor to get started</p>
            <button className="btn-primary">Add Vendor</button>
          </div>
        )}
      </Card>
    </div>
  );
}
