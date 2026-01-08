import { FileText } from 'lucide-react';

export function Quotations() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
        <p className="text-gray-500">Create and manage customer quotations with cost/revenue breakdown.</p>
      </div>

      <div className="card text-center py-16">
        <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Quotations Module</h3>
        <p className="text-gray-500 mb-4">Coming soon - Create quotes, add line items, calculate margins</p>
        <button className="btn-primary">Create Quotation</button>
      </div>
    </div>
  );
}
