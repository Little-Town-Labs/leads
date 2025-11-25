import { getOrgDb } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, Building2, Calendar } from 'lucide-react';
import { ApproveRejectButtons } from './approve-reject-buttons';

export default async function LeadDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const orgDb = await getOrgDb();
  const canApprove = await hasPermission('leads:approve');

  // Fetch lead
  const lead = await orgDb.leads.findById(params.id);

  if (!lead) {
    notFound();
  }

  // Fetch workflows for this lead
  const workflows = await orgDb.workflows.findByLeadId(lead.id);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/leads"
        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to leads
      </Link>

      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{lead.name}</h1>
            <div className="mt-2 flex items-center space-x-4">
              <span
                className={`inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${
                  lead.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : lead.status === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {lead.status}
              </span>
              {lead.qualificationCategory && (
                <span
                  className={`inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${
                    lead.qualificationCategory === 'QUALIFIED'
                      ? 'bg-green-100 text-green-800'
                      : lead.qualificationCategory === 'FOLLOW_UP'
                      ? 'bg-blue-100 text-blue-800'
                      : lead.qualificationCategory === 'SUPPORT'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {lead.qualificationCategory}
                </span>
              )}
            </div>
          </div>
          {canApprove && lead.status === 'pending' && (
            <div className="mt-4 sm:mt-0">
              <ApproveRejectButtons leadId={lead.id} />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Contact Information
            </h2>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="flex items-start">
                <Mail className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <a
                      href={`mailto:${lead.email}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {lead.email}
                    </a>
                  </dd>
                </div>
              </div>

              {lead.phone && (
                <div className="flex items-start">
                  <Phone className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <a
                        href={`tel:${lead.phone}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {lead.phone}
                      </a>
                    </dd>
                  </div>
                </div>
              )}

              {lead.company && (
                <div className="flex items-start">
                  <Building2 className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Company</dt>
                    <dd className="mt-1 text-sm text-gray-900">{lead.company}</dd>
                  </div>
                </div>
              )}

              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <dt className="text-sm font-medium text-gray-500">Submitted</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(lead.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </dd>
                </div>
              </div>
            </dl>
          </div>

          {/* Message */}
          {lead.message && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Message</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.message}</p>
            </div>
          )}

          {/* Qualification Details */}
          {lead.qualificationReason && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Qualification Analysis
              </h2>
              <div className="prose prose-sm max-w-none">
                <p className="text-sm text-gray-700">{lead.qualificationReason}</p>
              </div>
            </div>
          )}

          {/* Email Draft */}
          {lead.emailDraft && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Email Draft
              </h2>
              <div className="bg-gray-50 rounded-md p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {lead.emailDraft}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Research Results */}
          {lead.researchResults != null && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Research Results
              </h2>
              <div className="text-sm text-gray-700">
                <p className="line-clamp-6">
                  {typeof lead.researchResults === 'string'
                    ? lead.researchResults
                    : JSON.stringify(lead.researchResults)}
                </p>
              </div>
            </div>
          )}

          {/* Workflow History */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Workflow History
            </h2>
            {workflows.length === 0 ? (
              <p className="text-sm text-gray-500">No workflow history yet</p>
            ) : (
              <div className="space-y-4">
                {workflows.map((workflow) => (
                  <div key={workflow.id} className="border-l-2 border-gray-200 pl-4">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-medium ${
                          workflow.status === 'completed'
                            ? 'text-green-600'
                            : workflow.status === 'failed'
                            ? 'text-red-600'
                            : 'text-yellow-600'
                        }`}
                      >
                        {workflow.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(workflow.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-700">Workflow {workflow.id.slice(0, 8)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Details</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Lead ID</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono text-xs">
                  {lead.id}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(lead.createdAt).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Updated</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(lead.updatedAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
