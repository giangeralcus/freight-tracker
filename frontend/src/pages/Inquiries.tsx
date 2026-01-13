import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  MessageSquare,
  Sparkles,
  Check,
  AlertCircle,
  Loader2,
  Ship,
  Package,
  MapPin,
  User,
  FileText,
  ChevronRight,
  X,
} from 'lucide-react';

interface ParsedInquiry {
  customer_name: string | null;
  customer_email: string | null;
  customer_id: number | null;
  customer_matched: string | null;
  incoterm: string | null;
  service_type: string | null;
  pol: string | null;
  pol_id: number | null;
  pol_matched: string | null;
  pod: string | null;
  pod_id: number | null;
  pod_matched: string | null;
  commodity: string | null;
  is_dg: boolean;
  dg_class: string | null;
  weight_kg: number | null;
  volume_cbm: number | null;
  container_type: string | null;
  container_qty: number | null;
  required_date: string | null;
  special_requirements: string | null;
  confidence: number;
}

interface Inquiry {
  id: number;
  inquiry_number: string;
  inquiry_date: string;
  customer_name: string;
  customer_email: string;
  service_type: string;
  pol: string;
  pod: string;
  commodity: string;
  status: string;
  created_at: string;
}

export function Inquiries() {
  const queryClient = useQueryClient();
  const [showParser, setShowParser] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [parsedData, setParsedData] = useState<ParsedInquiry | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Check LLM status
  const { data: llmStatus } = useQuery({
    queryKey: ['llm-status'],
    queryFn: async () => {
      const res = await api.get('/api/inquiries/llm-status');
      return res.data;
    },
    refetchInterval: 30000, // Check every 30s
  });

  // Fetch inquiries
  const { data: inquiries, isLoading } = useQuery({
    queryKey: ['inquiries'],
    queryFn: async () => {
      const res = await api.get('/api/inquiries');
      return res.data as Inquiry[];
    },
  });

  // Parse email mutation
  const parseMutation = useMutation({
    mutationFn: async (data: { email_subject: string; email_body: string }) => {
      const res = await api.post('/api/inquiries/parse', data);
      return res.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        setParsedData(data.parsed);
        setParseError(null);
      } else {
        setParseError(data.error);
      }
    },
    onError: (error: any) => {
      setParseError(error.response?.data?.error || error.message);
    },
  });

  // Create inquiry mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/api/inquiries', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
      setShowParser(false);
      setParsedData(null);
      setEmailSubject('');
      setEmailBody('');
    },
  });

  const handleParse = () => {
    if (!emailBody.trim()) return;
    setParseError(null);
    setParsedData(null);
    parseMutation.mutate({ email_subject: emailSubject, email_body: emailBody });
  };

  const handleCreateInquiry = () => {
    if (!parsedData) return;
    createMutation.mutate({
      customer_id: parsedData.customer_id,
      customer_name: parsedData.customer_matched || parsedData.customer_name,
      customer_email: parsedData.customer_email,
      incoterm: parsedData.incoterm,
      service_type: parsedData.service_type,
      pol: parsedData.pol,
      pol_id: parsedData.pol_id,
      pod: parsedData.pod,
      pod_id: parsedData.pod_id,
      commodity: parsedData.commodity,
      is_dg: parsedData.is_dg,
      dg_class: parsedData.dg_class,
      weight_kg: parsedData.weight_kg,
      volume_cbm: parsedData.volume_cbm,
      container_type: parsedData.container_type,
      container_qty: parsedData.container_qty,
      email_subject: emailSubject,
      email_body: emailBody,
      notes: parsedData.special_requirements,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-blue-100 text-blue-800';
      case 'QUOTED': return 'bg-yellow-100 text-yellow-800';
      case 'WON': return 'bg-green-100 text-green-800';
      case 'LOST': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inquiries</h1>
          <p className="text-gray-500">Parse customer emails and convert to quotations</p>
        </div>
        <button
          onClick={() => setShowParser(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Parse Email with AI
        </button>
      </div>

      {/* LLM Status */}
      <div className={`mb-6 p-3 rounded-lg flex items-center gap-2 ${
        llmStatus?.available ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
      }`}>
        {llmStatus?.available ? (
          <>
            <Check className="w-4 h-4" />
            <span>AI Parser ready ({llmStatus.model})</span>
          </>
        ) : (
          <>
            <AlertCircle className="w-4 h-4" />
            <span>AI Parser offline - Run: <code className="bg-yellow-100 px-1 rounded">ollama serve</code></span>
          </>
        )}
      </div>

      {/* Email Parser Modal */}
      {showParser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold">AI Email Parser</h2>
              </div>
              <button
                onClick={() => {
                  setShowParser(false);
                  setParsedData(null);
                  setParseError(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex divide-x max-h-[calc(90vh-130px)] overflow-hidden">
              {/* Left: Email Input */}
              <div className="w-1/2 p-4 flex flex-col">
                <h3 className="font-medium text-gray-900 mb-3">Paste Customer Email</h3>

                <input
                  type="text"
                  placeholder="Email Subject (optional)"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg mb-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />

                <textarea
                  placeholder="Paste the email body here...

Example:
Dear GPI Team,

We need a quotation for FCL shipment:
- Origin: Jakarta, Indonesia
- Destination: Melbourne, Australia
- Cargo: Electronic Components
- Weight: 15,000 KGS
- Container: 1 x 40HC

Please advise your best rate.

Best regards,
John Smith
ABC Trading Co."
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="flex-1 w-full px-3 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                />

                <button
                  onClick={handleParse}
                  disabled={!emailBody.trim() || parseMutation.isPending || !llmStatus?.available}
                  className="mt-4 btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {parseMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Parsing with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Parse Email
                    </>
                  )}
                </button>

                {parseError && (
                  <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    {parseError}
                  </div>
                )}
              </div>

              {/* Right: Parsed Results */}
              <div className="w-1/2 p-4 overflow-y-auto bg-gray-50">
                <h3 className="font-medium text-gray-900 mb-3">Extracted Data</h3>

                {parsedData ? (
                  <div className="space-y-4">
                    {/* Confidence */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Confidence:</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 rounded-full h-2"
                          style={{ width: `${parsedData.confidence * 100}%` }}
                        />
                      </div>
                      <span className="font-medium">{Math.round(parsedData.confidence * 100)}%</span>
                    </div>

                    {/* Customer */}
                    <div className="bg-white rounded-lg p-3 border">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                        <User className="w-4 h-4" />
                        Customer
                      </div>
                      <p className="font-medium">
                        {parsedData.customer_matched || parsedData.customer_name || '-'}
                        {parsedData.customer_id && (
                          <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                            Matched
                          </span>
                        )}
                      </p>
                      {parsedData.customer_email && (
                        <p className="text-sm text-gray-500">{parsedData.customer_email}</p>
                      )}
                    </div>

                    {/* Route */}
                    <div className="bg-white rounded-lg p-3 border">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                        <MapPin className="w-4 h-4" />
                        Route
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">POL</p>
                          <p className="font-medium">
                            {parsedData.pol_matched || parsedData.pol || '-'}
                            {parsedData.pol_id && (
                              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                ✓
                              </span>
                            )}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">POD</p>
                          <p className="font-medium">
                            {parsedData.pod_matched || parsedData.pod || '-'}
                            {parsedData.pod_id && (
                              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                ✓
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Shipment Details */}
                    <div className="bg-white rounded-lg p-3 border">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                        <Ship className="w-4 h-4" />
                        Shipment Details
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500">Service</p>
                          <p className="font-medium">{parsedData.service_type || '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Incoterm</p>
                          <p className="font-medium">{parsedData.incoterm || '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Container</p>
                          <p className="font-medium">
                            {parsedData.container_qty && parsedData.container_type
                              ? `${parsedData.container_qty} x ${parsedData.container_type}`
                              : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">DG</p>
                          <p className="font-medium">
                            {parsedData.is_dg ? `Yes (${parsedData.dg_class || 'N/A'})` : 'No'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Cargo */}
                    <div className="bg-white rounded-lg p-3 border">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                        <Package className="w-4 h-4" />
                        Cargo
                      </div>
                      <p className="font-medium mb-2">{parsedData.commodity || '-'}</p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500">Weight</p>
                          <p className="font-medium">
                            {parsedData.weight_kg ? `${parsedData.weight_kg.toLocaleString()} KG` : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Volume</p>
                          <p className="font-medium">
                            {parsedData.volume_cbm ? `${parsedData.volume_cbm} CBM` : '-'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Special Requirements */}
                    {parsedData.special_requirements && (
                      <div className="bg-white rounded-lg p-3 border">
                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                          <FileText className="w-4 h-4" />
                          Special Requirements
                        </div>
                        <p className="text-sm">{parsedData.special_requirements}</p>
                      </div>
                    )}

                    {/* Create Button */}
                    <button
                      onClick={handleCreateInquiry}
                      disabled={createMutation.isPending}
                      className="w-full btn-primary flex items-center justify-center gap-2"
                    >
                      {createMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Create Inquiry
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Paste an email and click "Parse Email"</p>
                      <p className="text-sm mt-1">AI will extract shipment details automatically</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inquiries List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : inquiries && inquiries.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Inquiry #</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Date</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Customer</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Route</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Cargo</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {inquiries.map((inquiry) => (
                <tr key={inquiry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm">{inquiry.inquiry_number}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(inquiry.inquiry_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{inquiry.customer_name}</p>
                    <p className="text-sm text-gray-500">{inquiry.customer_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm">
                      <span>{inquiry.pol}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                      <span>{inquiry.pod}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{inquiry.commodity}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(inquiry.status)}`}>
                      {inquiry.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                      Create Quote
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card text-center py-16">
          <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Inquiries Yet</h3>
          <p className="text-gray-500 mb-4">Parse your first customer email to create an inquiry</p>
          <button
            onClick={() => setShowParser(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Parse Email with AI
          </button>
        </div>
      )}
    </div>
  );
}
