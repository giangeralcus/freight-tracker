import { TrendingUp } from 'lucide-react';

export function Reports() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500">Analyze profit by customer, route, and time period.</p>
      </div>

      <div className="card text-center py-16">
        <TrendingUp className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Reports Module</h3>
        <p className="text-gray-500 mb-4">Coming soon - Monthly profit, customer profit, route analysis</p>
        <button className="btn-primary">Generate Report</button>
      </div>
    </div>
  );
}
