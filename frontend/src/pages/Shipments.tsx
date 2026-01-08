import { Ship } from 'lucide-react';

export function Shipments() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Shipments</h1>
        <p className="text-gray-500">Track shipments and actual costs vs quoted amounts.</p>
      </div>

      <div className="card text-center py-16">
        <Ship className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Shipments Module</h3>
        <p className="text-gray-500 mb-4">Coming soon - Track shipments, record actual costs, calculate profit</p>
        <button className="btn-primary">Create Shipment</button>
      </div>
    </div>
  );
}
