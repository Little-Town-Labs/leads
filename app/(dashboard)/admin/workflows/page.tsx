import { Workflow, Zap, AlertCircle } from 'lucide-react';

export default function WorkflowsAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">AI Workflow Configuration</h2>
        <p className="mt-1 text-sm text-gray-600">
          Configure AI research tools and workflow behavior
        </p>
      </div>

      {/* Workflow Status */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Workflow className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-medium text-gray-900">Workflow Status</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-700 mb-2">
              <Zap className="w-4 h-4" />
              <span className="font-medium">AI Research</span>
            </div>
            <p className="text-sm text-green-600">Active - Using Exa.ai for web search</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-700 mb-2">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">CRM Integration</span>
            </div>
            <p className="text-sm text-yellow-600">Not configured - Returns empty results</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-700 mb-2">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Tech Stack</span>
            </div>
            <p className="text-sm text-yellow-600">Not configured - Returns empty results</p>
          </div>
        </div>
      </div>

      {/* Research Tools */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Available Research Tools</h3>

        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Web Search (Exa.ai)</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Deep web search for company info, news, research papers
                </p>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-gray-900">URL Content Fetcher</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Extract and analyze content from public URLs
                </p>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Knowledge Base Search</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Query your organization's knowledge base using vector search
                </p>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-gray-900">CRM Search</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Search for existing opportunities in your CRM
                </p>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    Placeholder - Needs Configuration
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Tech Stack Analysis</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Analyze technology stack of lead's domain
                </p>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    Placeholder - Needs Configuration
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Workflow Configuration</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Research agent is limited to 20 steps per lead to prevent runaway execution</li>
          <li>• Workflows require human approval via Slack before sending emails</li>
          <li>• AI model: GPT-4 via Vercel AI Gateway</li>
          <li>• To configure CRM/Tech Stack tools, edit lib/services.ts</li>
        </ul>
      </div>
    </div>
  );
}
