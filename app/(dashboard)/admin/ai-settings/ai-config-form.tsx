'use client';

import { useState, useTransition } from 'react';
import { updateAiConfigAction, testAiConfigAction, resetToPlatformDefaultAction } from './actions';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface AiConfigFormProps {
  initialConfig: {
    provider: 'openrouter' | 'openai' | 'anthropic' | 'platform_default';
    models: {
      chat: string;
      embedding: string;
    };
    hasApiKey: boolean;
    openrouterSettings?: {
      siteUrl?: string;
      siteName?: string;
    };
    usageTracking: boolean;
    costAlerts?: {
      enabled: boolean;
      monthlyThreshold: number;
      email: string;
    };
  };
}

export function AiConfigForm({ initialConfig }: AiConfigFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isTesting, setIsTesting] = useState(false);
  const [provider, setProvider] = useState(initialConfig.provider);
  const [chatModel, setChatModel] = useState(initialConfig.models.chat);
  const [embeddingModel, setEmbeddingModel] = useState(initialConfig.models.embedding);
  const [customChatModel, setCustomChatModel] = useState('');
  const [customEmbeddingModel, setCustomEmbeddingModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [openrouterSiteUrl, setOpenrouterSiteUrl] = useState(
    initialConfig.openrouterSettings?.siteUrl || ''
  );
  const [openrouterSiteName, setOpenrouterSiteName] = useState(
    initialConfig.openrouterSettings?.siteName || ''
  );
  const [usageTracking, setUsageTracking] = useState(initialConfig.usageTracking);
  const [costAlertsEnabled, setCostAlertsEnabled] = useState(
    initialConfig.costAlerts?.enabled || false
  );
  const [costAlertsThreshold, setCostAlertsThreshold] = useState(
    (initialConfig.costAlerts?.monthlyThreshold || 10000) / 100 // Convert cents to dollars
  );
  const [costAlertsEmail, setCostAlertsEmail] = useState(
    initialConfig.costAlerts?.email || ''
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Use custom model if 'custom' is selected
    const finalChatModel = chatModel === 'custom' ? customChatModel : chatModel;
    const finalEmbeddingModel = embeddingModel === 'custom' ? customEmbeddingModel : embeddingModel;

    startTransition(async () => {
      try {
        await updateAiConfigAction({
          provider,
          chatModel: finalChatModel,
          embeddingModel: finalEmbeddingModel,
          apiKey: apiKey || undefined,
          openrouterSiteUrl,
          openrouterSiteName,
          usageTracking,
          costAlertsEnabled,
          costAlertsThreshold: costAlertsThreshold * 100, // Convert to cents
          costAlertsEmail,
        });

        toast.success('AI configuration updated successfully');
        setApiKey(''); // Clear API key field after save
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to update configuration');
      }
    });
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const result = await testAiConfigAction();
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to test configuration');
    } finally {
      setIsTesting(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset to platform default? This will remove your custom API key.')) {
      return;
    }

    startTransition(async () => {
      try {
        await resetToPlatformDefaultAction();
        toast.success('Reset to platform default');
        window.location.reload();
      } catch (error) {
        toast.error('Failed to reset configuration');
      }
    });
  };

  // Model options based on provider
  const modelOptions = {
    openrouter: {
      chat: [
        { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (Recommended)' },
        { value: 'anthropic/claude-3.5-sonnet:beta', label: 'Claude 3.5 Sonnet (Beta)' },
        { value: 'anthropic/claude-3-opus', label: 'Claude 3 Opus' },
        { value: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku (Fast)' },
        { value: 'openai/gpt-4o', label: 'GPT-4o' },
        { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini (Fast & Cheap)' },
        { value: 'openai/gpt-4-turbo', label: 'GPT-4 Turbo' },
        { value: 'openai/o1-preview', label: 'OpenAI o1 Preview' },
        { value: 'openai/o1-mini', label: 'OpenAI o1 Mini' },
        { value: 'google/gemini-pro-1.5', label: 'Gemini Pro 1.5' },
        { value: 'google/gemini-flash-1.5', label: 'Gemini Flash 1.5 (Fast)' },
        { value: 'google/gemini-2.0-flash-exp:free', label: 'Gemini 2.0 Flash (Free)' },
        { value: 'meta-llama/llama-3.1-405b-instruct', label: 'Llama 3.1 405B' },
        { value: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B' },
        { value: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B' },
        { value: 'deepseek/deepseek-chat', label: 'DeepSeek Chat' },
        { value: 'deepseek/deepseek-r1', label: 'DeepSeek R1' },
        { value: 'qwen/qwen-2.5-72b-instruct', label: 'Qwen 2.5 72B' },
        { value: 'x-ai/grok-beta', label: 'Grok Beta' },
        { value: 'perplexity/llama-3.1-sonar-large-128k-online', label: 'Perplexity Sonar (Online)' },
        { value: 'custom', label: '✏️ Custom Model...' },
      ],
      embedding: [
        { value: 'text-embedding-3-small', label: 'OpenAI text-embedding-3-small (Recommended)' },
        { value: 'text-embedding-3-large', label: 'OpenAI text-embedding-3-large' },
        { value: 'custom', label: '✏️ Custom Model...' },
      ],
    },
    openai: {
      chat: [
        { value: 'gpt-4o', label: 'GPT-4o (Recommended)' },
        { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
        { value: 'gpt-4', label: 'GPT-4' },
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
        { value: 'o1-preview', label: 'o1 Preview' },
        { value: 'o1-mini', label: 'o1 Mini' },
        { value: 'custom', label: '✏️ Custom Model...' },
      ],
      embedding: [
        { value: 'text-embedding-3-small', label: 'text-embedding-3-small (Recommended)' },
        { value: 'text-embedding-3-large', label: 'text-embedding-3-large' },
        { value: 'text-embedding-ada-002', label: 'text-embedding-ada-002 (Legacy)' },
        { value: 'custom', label: '✏️ Custom Model...' },
      ],
    },
    anthropic: {
      chat: [
        { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Recommended)' },
        { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
        { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
        { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
        { value: 'custom', label: '✏️ Custom Model...' },
      ],
      embedding: [
        { value: 'text-embedding-3-small', label: 'OpenAI text-embedding-3-small (via OpenRouter)' },
        { value: 'custom', label: '✏️ Custom Model...' },
      ],
    },
    platform_default: {
      chat: [{ value: 'openai/gpt-4o', label: 'GPT-4o (Platform Default)' }],
      embedding: [{ value: 'text-embedding-3-small', label: 'text-embedding-3-small' }],
    },
  };

  const currentModels = modelOptions[provider];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Provider Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          AI Provider
        </label>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as any)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isPending}
        >
          <option value="platform_default">Platform Default (Free Tier)</option>
          <option value="openrouter">OpenRouter (100+ Models - Recommended)</option>
          <option value="openai">OpenAI Direct</option>
          <option value="anthropic">Anthropic Direct</option>
        </select>
        <p className="mt-1 text-sm text-gray-500">
          {provider === 'platform_default' && 'Use platform API key (limited to 50 requests/month)'}
          {provider === 'openrouter' && 'Access 100+ models with a single API key'}
          {provider === 'openai' && 'Use your OpenAI enterprise agreement'}
          {provider === 'anthropic' && 'Use your Anthropic enterprise agreement'}
        </p>
      </div>

      {/* API Key */}
      {provider !== 'platform_default' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API Key {initialConfig.hasApiKey && <span className="text-green-600">(Configured)</span>}
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={initialConfig.hasApiKey ? '••••••••••••••••' : 'Enter your API key'}
              className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isPending}
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700"
            >
              {showApiKey ? 'Hide' : 'Show'}
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {provider === 'openrouter' && 'Get your API key at openrouter.ai'}
            {provider === 'openai' && 'Get your API key at platform.openai.com'}
            {provider === 'anthropic' && 'Get your API key at console.anthropic.com'}
          </p>
        </div>
      )}

      {/* Chat Model */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Chat Model
        </label>
        <select
          value={chatModel}
          onChange={(e) => setChatModel(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isPending}
        >
          {currentModels.chat.map((model) => (
            <option key={model.value} value={model.value}>
              {model.label}
            </option>
          ))}
        </select>
        {chatModel === 'custom' && (
          <div className="mt-3">
            <input
              type="text"
              value={customChatModel}
              onChange={(e) => setCustomChatModel(e.target.value)}
              placeholder={provider === 'openrouter' ? 'e.g., anthropic/claude-3.5-sonnet' : 'e.g., gpt-4o'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              disabled={isPending}
            />
            <p className="mt-1 text-xs text-gray-500">
              {provider === 'openrouter' && 'Browse models at openrouter.ai/models'}
              {provider === 'openai' && 'See available models at platform.openai.com/docs/models'}
              {provider === 'anthropic' && 'See available models at docs.anthropic.com/en/docs/models-overview'}
            </p>
          </div>
        )}
        <p className="mt-1 text-sm text-gray-500">
          Used for lead research, qualification, and email generation
        </p>
      </div>

      {/* Embedding Model */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Embedding Model
        </label>
        <select
          value={embeddingModel}
          onChange={(e) => setEmbeddingModel(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isPending}
        >
          {currentModels.embedding.map((model) => (
            <option key={model.value} value={model.value}>
              {model.label}
            </option>
          ))}
        </select>
        {embeddingModel === 'custom' && (
          <div className="mt-3">
            <input
              type="text"
              value={customEmbeddingModel}
              onChange={(e) => setCustomEmbeddingModel(e.target.value)}
              placeholder="e.g., text-embedding-3-small"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              disabled={isPending}
            />
            <p className="mt-1 text-xs text-gray-500">
              {provider === 'openrouter' && 'Browse embedding models at openrouter.ai/models'}
              {provider === 'openai' && 'See available models at platform.openai.com/docs/models'}
              {provider === 'anthropic' && 'Note: Anthropic doesn\'t provide embedding models, use OpenAI via OpenRouter'}
            </p>
          </div>
        )}
        <p className="mt-1 text-sm text-gray-500">
          Used for knowledge base search
        </p>
      </div>

      {/* OpenRouter Settings */}
      {provider === 'openrouter' && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900">OpenRouter Settings (Optional)</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Site URL
            </label>
            <input
              type="url"
              value={openrouterSiteUrl}
              onChange={(e) => setOpenrouterSiteUrl(e.target.value)}
              placeholder="https://yourdomain.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isPending}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Site Name
            </label>
            <input
              type="text"
              value={openrouterSiteName}
              onChange={(e) => setOpenrouterSiteName(e.target.value)}
              placeholder="Your Company Name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isPending}
            />
          </div>
        </div>
      )}

      {/* Usage Tracking */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="usageTracking"
          checked={usageTracking}
          onChange={(e) => setUsageTracking(e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          disabled={isPending}
        />
        <label htmlFor="usageTracking" className="text-sm font-medium text-gray-700">
          Enable usage tracking and analytics
        </label>
      </div>

      {/* Cost Alerts */}
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="costAlerts"
            checked={costAlertsEnabled}
            onChange={(e) => setCostAlertsEnabled(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            disabled={isPending}
          />
          <label htmlFor="costAlerts" className="text-sm font-medium text-gray-700">
            Enable cost alerts
          </label>
        </div>

        {costAlertsEnabled && (
          <div className="space-y-4 ml-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Threshold (USD)
              </label>
              <input
                type="number"
                value={costAlertsThreshold}
                onChange={(e) => setCostAlertsThreshold(Number(e.target.value))}
                min="1"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isPending}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alert Email
              </label>
              <input
                type="email"
                value={costAlertsEmail}
                onChange={(e) => setCostAlertsEmail(e.target.value)}
                placeholder="alerts@yourcompany.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isPending}
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Save Configuration
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleTest}
          disabled={isTesting || isPending}
          className="flex items-center gap-2"
        >
          {isTesting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Testing...
            </>
          ) : (
            'Test Configuration'
          )}
        </Button>

        {provider !== 'platform_default' && (
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isPending}
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <AlertCircle className="w-4 h-4" />
            Reset to Default
          </Button>
        )}
      </div>
    </form>
  );
}
