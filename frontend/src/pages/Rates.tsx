import { Package } from 'lucide-react';

export function Rates() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Vendor Rates</h1>
        <p className="text-gray-500">Manage FCL rates and surcharges from vendors.</p>
      </div>

      <div className="card text-center py-16">
        <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Rates Module</h3>
        <p className="text-gray-500 mb-4">Coming soon - Manage FCL rates, surcharges, validity periods</p>
        <button className="btn-primary">Add Rate</button>
      </div>
    </div>
  );
}
