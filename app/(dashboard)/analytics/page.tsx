import { getOrgDb } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';
import { BarChart3, TrendingUp, Users, Clock } from 'lucide-react';

export default async function AnalyticsPage() {
  const canView = await hasPermission('analytics:view');

  if (!canView) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">You don't have permission to view analytics.</p>
      </div>
    );
  }

  const orgDb = await getOrgDb();
  const leads = await orgDb.leads.findMany();
  const counts = await orgDb.leads.countByStatus();
  const workflows = await orgDb.workflows.findMany();

  // Calculate statistics
  const totalLeads = leads.length;
  const approvalRate = totalLeads > 0 ? (counts.approved / totalLeads) * 100 : 0;

  // Calculate average processing time from completed workflows
  const completedWorkflows = workflows.filter(w => w.completedAt && w.createdAt);
  const avgProcessingTimeMs = completedWorkflows.length > 0
    ? completedWorkflows.reduce((sum, w) => {
        const duration = w.completedAt!.getTime() - w.createdAt.getTime();
        return sum + duration;
      }, 0) / completedWorkflows.length
    : 0;

  // Convert to hours with 1 decimal place
  const avgProcessingTime = (avgProcessingTimeMs / (1000 * 60 * 60)).toFixed(1);

  // Group by qualification category
  const categoryStats = leads.reduce((acc, lead) => {
    if (lead.qualificationCategory) {
      acc[lead.qualificationCategory] = (acc[lead.qualificationCategory] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Group by date for trend analysis
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split('T')[0];
  });

  const leadsByDate = last30Days.map((date) => {
    const count = leads.filter((lead) =>
      lead.createdAt.toISOString().startsWith(date)
    ).length;
    return { date, count };
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-2 text-sm text-gray-700">
          Insights and metrics for your lead qualification process
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Leads
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">{totalLeads}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Approval Rate
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {approvalRate.toFixed(1)}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Avg. Processing
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {avgProcessingTime}h
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pending Review
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {counts.pending}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Qualification Categories */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Leads by Qualification Category
        </h2>
        <div className="space-y-4">
          {Object.entries(categoryStats).map(([category, count]) => {
            const percentage = (count / totalLeads) * 100;
            return (
              <div key={category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{category}</span>
                  <span className="text-sm text-gray-500">
                    {count} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      category === 'QUALIFIED'
                        ? 'bg-green-500'
                        : category === 'FOLLOW_UP'
                        ? 'bg-blue-500'
                        : category === 'SUPPORT'
                        ? 'bg-purple-500'
                        : 'bg-gray-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lead Status Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Pending</h3>
          <p className="text-3xl font-bold text-yellow-600">{counts.pending}</p>
          <p className="mt-1 text-sm text-gray-500">
            {totalLeads > 0 ? ((counts.pending / totalLeads) * 100).toFixed(1) : 0}% of
            total
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Approved</h3>
          <p className="text-3xl font-bold text-green-600">{counts.approved}</p>
          <p className="mt-1 text-sm text-gray-500">
            {totalLeads > 0 ? ((counts.approved / totalLeads) * 100).toFixed(1) : 0}% of
            total
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Rejected</h3>
          <p className="text-3xl font-bold text-red-600">{counts.rejected}</p>
          <p className="mt-1 text-sm text-gray-500">
            {totalLeads > 0 ? ((counts.rejected / totalLeads) * 100).toFixed(1) : 0}% of
            total
          </p>
        </div>
      </div>

      {/* Simple trend visualization (text-based) */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          30-Day Lead Trend
        </h2>
        <div className="text-sm text-gray-500 mb-4">
          Showing lead submissions over the last 30 days
        </div>
        <div className="space-y-1">
          {leadsByDate.slice(-14).map(({ date, count }) => (
            <div key={date} className="flex items-center">
              <div className="w-24 text-xs text-gray-500">
                {new Date(date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
              <div className="flex-1">
                <div className="bg-blue-200 h-4 rounded" style={{ width: `${count * 20}%` }}>
                  <span className="ml-2 text-xs">{count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
