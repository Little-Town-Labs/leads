import { getAiConfigAction } from './actions';
import { AiConfigForm } from './ai-config-form';
import { Cpu, DollarSign, TrendingUp, Activity } from 'lucide-react';
import { auth } from '@clerk/nextjs/server';
import { getMonthlyUsage } from '@/lib/ai-usage';
import { isUsingCustomApiKey } from '@/lib/ai-config';

export default async function AiSettingsPage() {
  const { orgId } = await auth();

  if (!orgId) {
    return <div>No organization context</div>;
  }

  let config;
  let monthlyUsage;
  let usingByok = false;

  try {
    config = await getAiConfigAction();
    monthlyUsage = await getMonthlyUsage(orgId);
    usingByok = await isUsingCustomApiKey(orgId);
  } catch (error) {
    console.error('Error loading AI settings:', error);
    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">Database Migration Required</h3>
          <p className="text-sm text-yellow-800 mb-4">
            The AI settings feature requires database schema updates. Please run the database migration:
          </p>
          <code className="block bg-yellow-100 text-yellow-900 p-3 rounded text-sm">
            pnpm db:push
          </code>
          <p className="text-sm text-yellow-800 mt-4">
            After running the migration, refresh this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Cpu className="w-6 h-6" />
          AI Configuration
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Configure your organization's AI models and API keys. Bring your own key (BYOK) for unlimited usage and cost control.
        </p>
      </div>

      {/* Usage Statistics */}
      {config.usageTracking && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {monthlyUsage.totalRequests.toLocaleString()}
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
            <p className="mt-2 text-xs text-gray-500">This month</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tokens</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {(monthlyUsage.totalTokens / 1000).toFixed(1)}K
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
            <p className="mt-2 text-xs text-gray-500">This month</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cost</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  ${(monthlyUsage.totalCost / 100).toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {usingByok ? 'Your API key' : 'Platform default'}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {monthlyUsage.successRate.toFixed(1)}%
                </p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {monthlyUsage.successfulRequests} / {monthlyUsage.totalRequests} successful
            </p>
          </div>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Why use BYOK?</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Unlimited AI requests (no monthly limits)</li>
            <li>✓ Full cost control and transparency</li>
            <li>✓ Choose from 100+ models via OpenRouter</li>
            <li>✓ Your data stays private (use your own agreements)</li>
          </ul>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-2">OpenRouter Recommended</h3>
          <ul className="text-sm text-green-800 space-y-1">
            <li>✓ Single API key for 100+ models</li>
            <li>✓ GPT-4, Claude, Gemini, Llama, and more</li>
            <li>✓ Pay-as-you-go pricing</li>
            <li>✓ Automatic fallbacks and load balancing</li>
          </ul>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <AiConfigForm initialConfig={config} />
      </div>

      {/* Usage by Operation */}
      {config.usageTracking && Object.keys(monthlyUsage.byOperation).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage by Operation</h3>
          <div className="space-y-3">
            {Object.entries(monthlyUsage.byOperation).map(([operation, stats]) => (
              <div key={operation} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-900 capitalize">{operation}</p>
                  <p className="text-sm text-gray-500">
                    {stats.count} requests · {(stats.tokens / 1000).toFixed(1)}K tokens
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">${(stats.cost / 100).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">
                    ${((stats.cost / stats.count) / 100).toFixed(4)}/req
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage by Model */}
      {config.usageTracking && Object.keys(monthlyUsage.byModel).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage by Model</h3>
          <div className="space-y-3">
            {Object.entries(monthlyUsage.byModel).map(([model, stats]) => (
              <div key={model} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{model}</p>
                  <p className="text-sm text-gray-500">
                    {stats.count} requests · {(stats.tokens / 1000).toFixed(1)}K tokens
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">${(stats.cost / 100).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">
                    ${((stats.cost / stats.count) / 100).toFixed(4)}/req
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
