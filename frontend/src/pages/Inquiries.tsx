import { MessageSquare } from 'lucide-react';

export function Inquiries() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Inquiries</h1>
        <p className="text-gray-500">Manage customer inquiries and convert to quotations.</p>
      </div>

      <div className="card text-center py-16">
        <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Inquiries Module</h3>
        <p className="text-gray-500 mb-4">Coming soon - Parse emails, create inquiries, convert to quotations</p>
        <button className="btn-primary">Create Inquiry</button>
      </div>
    </div>
  );
}
