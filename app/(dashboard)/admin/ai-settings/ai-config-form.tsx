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
  const [chatModelFilter, setChatModelFilter] = useState('');
  const [embeddingModelFilter, setEmbeddingModelFilter] = useState('');
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
        console.error('Form submission error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to update configuration';
        toast.error(errorMessage, {
          description: error instanceof Error && error.stack ? 'Check console for details' : undefined,
          duration: 10000,
        });
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

  // Curated model list - Focus on major providers (OpenAI, Google, Anthropic, xAI)
  // Use "Custom Model" option for other providers (Meta, DeepSeek, Mistral, etc.)
  const modelOptions = {
    openrouter: {
      chat: [
        // Anthropic Claude
        { value: 'anthropic/claude-sonnet-4.5', label: 'Claude Sonnet 4.5', maker: 'Anthropic', recommended: true },
        { value: 'anthropic/claude-opus-4.5', label: 'Claude Opus 4.5', maker: 'Anthropic' },
        { value: 'anthropic/claude-haiku-4.5', label: 'Claude Haiku 4.5', maker: 'Anthropic' },
        { value: 'anthropic/claude-opus-4.1', label: 'Claude Opus 4.1', maker: 'Anthropic' },
        { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet', maker: 'Anthropic' },
        { value: 'anthropic/claude-3.5-sonnet:beta', label: 'Claude 3.5 Sonnet (Beta)', maker: 'Anthropic' },
        { value: 'anthropic/claude-3.5-sonnet-20240620', label: 'Claude 3.5 Sonnet (20240620)', maker: 'Anthropic' },
        { value: 'anthropic/claude-3-opus', label: 'Claude 3 Opus', maker: 'Anthropic' },
        { value: 'anthropic/claude-3-opus-20240229', label: 'Claude 3 Opus (20240229)', maker: 'Anthropic' },
        { value: 'anthropic/claude-3-sonnet', label: 'Claude 3 Sonnet', maker: 'Anthropic' },
        { value: 'anthropic/claude-3-sonnet-20240229', label: 'Claude 3 Sonnet (20240229)', maker: 'Anthropic' },
        { value: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku', maker: 'Anthropic' },
        { value: 'anthropic/claude-3-haiku-20240307', label: 'Claude 3 Haiku (20240307)', maker: 'Anthropic' },
        { value: 'anthropic/claude-2', label: 'Claude 2', maker: 'Anthropic' },
        { value: 'anthropic/claude-2.1', label: 'Claude 2.1', maker: 'Anthropic' },
        { value: 'anthropic/claude-2.0', label: 'Claude 2.0', maker: 'Anthropic' },
        { value: 'anthropic/claude-instant-1', label: 'Claude Instant 1', maker: 'Anthropic' },
        { value: 'anthropic/claude-instant-1.2', label: 'Claude Instant 1.2', maker: 'Anthropic' },

        // OpenAI GPT
        { value: 'openai/gpt-5', label: 'GPT-5', maker: 'OpenAI' },
        { value: 'openai/gpt-5-mini', label: 'GPT-5 Mini', maker: 'OpenAI' },
        { value: 'openai/gpt-5-nano', label: 'GPT-5 Nano', maker: 'OpenAI' },
        { value: 'openai/gpt-4.1', label: 'GPT-4.1', maker: 'OpenAI' },
        { value: 'openai/gpt-4.1-mini', label: 'GPT-4.1 Mini', maker: 'OpenAI' },
        { value: 'openai/gpt-4.1-nano', label: 'GPT-4.1 Nano', maker: 'OpenAI' },
        { value: 'openai/gpt-4o', label: 'GPT-4o', maker: 'OpenAI' },
        { value: 'openai/gpt-4o-2024-11-20', label: 'GPT-4o (2024-11-20)', maker: 'OpenAI' },
        { value: 'openai/gpt-4o-2024-08-06', label: 'GPT-4o (2024-08-06)', maker: 'OpenAI' },
        { value: 'openai/gpt-4o-2024-05-13', label: 'GPT-4o (2024-05-13)', maker: 'OpenAI' },
        { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini', maker: 'OpenAI' },
        { value: 'openai/gpt-4o-mini-2024-07-18', label: 'GPT-4o Mini (2024-07-18)', maker: 'OpenAI' },
        { value: 'openai/gpt-4-turbo', label: 'GPT-4 Turbo', maker: 'OpenAI' },
        { value: 'openai/gpt-4-turbo-preview', label: 'GPT-4 Turbo Preview', maker: 'OpenAI' },
        { value: 'openai/gpt-4-1106-preview', label: 'GPT-4 1106 Preview', maker: 'OpenAI' },
        { value: 'openai/gpt-4', label: 'GPT-4', maker: 'OpenAI' },
        { value: 'openai/gpt-4-0314', label: 'GPT-4 (0314)', maker: 'OpenAI' },
        { value: 'openai/gpt-4-32k', label: 'GPT-4 32k', maker: 'OpenAI' },
        { value: 'openai/gpt-3.5-turbo', label: 'GPT-3.5 Turbo', maker: 'OpenAI' },
        { value: 'openai/gpt-3.5-turbo-0125', label: 'GPT-3.5 Turbo (0125)', maker: 'OpenAI' },
        { value: 'openai/gpt-3.5-turbo-1106', label: 'GPT-3.5 Turbo (1106)', maker: 'OpenAI' },
        { value: 'openai/gpt-3.5-turbo-16k', label: 'GPT-3.5 Turbo 16k', maker: 'OpenAI' },
        { value: 'openai/o1-preview', label: 'o1 Preview', maker: 'OpenAI' },
        { value: 'openai/o1-preview-2024-09-12', label: 'o1 Preview (2024-09-12)', maker: 'OpenAI' },
        { value: 'openai/o1-mini', label: 'o1 Mini', maker: 'OpenAI' },
        { value: 'openai/o1-mini-2024-09-12', label: 'o1 Mini (2024-09-12)', maker: 'OpenAI' },
        { value: 'openai/chatgpt-4o-latest', label: 'ChatGPT-4o Latest', maker: 'OpenAI' },

        // Google Gemini
        { value: 'google/gemini-3-pro-preview-20251117', label: 'Gemini 3 Pro Preview', maker: 'Google' },
        { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', maker: 'Google' },
        { value: 'google/gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite', maker: 'Google' },
        { value: 'google/gemini-2.5-flash-preview-09-2025', label: 'Gemini 2.5 Flash Preview', maker: 'Google' },
        { value: 'google/gemini-2.5-flash-lite-preview-09-2025', label: 'Gemini 2.5 Flash Lite Preview', maker: 'Google' },
        { value: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash 001', maker: 'Google' },
        { value: 'google/gemini-2.0-flash-exp:free', label: 'Gemini 2.0 Flash (Free)', maker: 'Google' },
        { value: 'google/gemini-exp-1206:free', label: 'Gemini Exp 1206 (Free)', maker: 'Google' },
        { value: 'google/gemini-exp-1121:free', label: 'Gemini Exp 1121 (Free)', maker: 'Google' },
        { value: 'google/gemini-pro-1.5', label: 'Gemini Pro 1.5', maker: 'Google' },
        { value: 'google/gemini-pro-1.5-exp', label: 'Gemini Pro 1.5 Experimental', maker: 'Google' },
        { value: 'google/gemini-flash-1.5', label: 'Gemini Flash 1.5', maker: 'Google' },
        { value: 'google/gemini-flash-1.5-exp', label: 'Gemini Flash 1.5 Experimental', maker: 'Google' },
        { value: 'google/gemini-flash-1.5-8b', label: 'Gemini Flash 1.5 8B', maker: 'Google' },
        { value: 'google/gemini-flash-1.5-8b-exp', label: 'Gemini Flash 1.5 8B Experimental', maker: 'Google' },
        { value: 'google/gemini-pro', label: 'Gemini Pro', maker: 'Google' },
        { value: 'google/gemini-pro-vision', label: 'Gemini Pro Vision', maker: 'Google' },
        { value: 'google/palm-2-chat-bison', label: 'PaLM 2 Chat Bison', maker: 'Google' },
        { value: 'google/palm-2-codechat-bison', label: 'PaLM 2 CodeChat Bison', maker: 'Google' },

        // xAI (X.AI)
        { value: 'x-ai/grok-beta', label: 'Grok Beta', maker: 'xAI' },
        { value: 'x-ai/grok-vision-beta', label: 'Grok Vision Beta', maker: 'xAI' },

        // Custom (for Meta, DeepSeek, Mistral, Cohere, Qwen, etc.)
        { value: 'custom', label: '✏️ Custom Model (Meta, DeepSeek, Mistral, etc.)...', maker: 'Other' },
      ],
      embedding: [
        // OpenAI
        { value: 'openai/text-embedding-3-small', label: 'text-embedding-3-small', maker: 'OpenAI', recommended: true },
        { value: 'openai/text-embedding-3-large', label: 'text-embedding-3-large', maker: 'OpenAI' },
        { value: 'openai/text-embedding-ada-002', label: 'text-embedding-ada-002', maker: 'OpenAI' },

        // Cohere
        { value: 'cohere/embed-english-v3.0', label: 'Embed English v3.0', maker: 'Cohere' },
        { value: 'cohere/embed-multilingual-v3.0', label: 'Embed Multilingual v3.0', maker: 'Cohere' },
        { value: 'cohere/embed-english-light-v3.0', label: 'Embed English Light v3.0', maker: 'Cohere' },
        { value: 'cohere/embed-multilingual-light-v3.0', label: 'Embed Multilingual Light v3.0', maker: 'Cohere' },

        // Voyage AI
        { value: 'voyage/voyage-3', label: 'Voyage 3', maker: 'Voyage AI' },
        { value: 'voyage/voyage-3-lite', label: 'Voyage 3 Lite', maker: 'Voyage AI' },
        { value: 'voyage/voyage-2', label: 'Voyage 2', maker: 'Voyage AI' },
        { value: 'voyage/voyage-code-2', label: 'Voyage Code 2', maker: 'Voyage AI' },

        // Google
        { value: 'google/text-embedding-004', label: 'Text Embedding 004', maker: 'Google' },

        // Custom
        { value: 'custom', label: '✏️ Custom Model...', maker: 'Custom' },
      ],
    },
    openai: {
      chat: [
        { value: 'gpt-4o', label: 'GPT-4o', maker: 'OpenAI', recommended: true },
        { value: 'gpt-4o-mini', label: 'GPT-4o Mini', maker: 'OpenAI' },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', maker: 'OpenAI' },
        { value: 'gpt-4', label: 'GPT-4', maker: 'OpenAI' },
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', maker: 'OpenAI' },
        { value: 'o1-preview', label: 'o1 Preview', maker: 'OpenAI' },
        { value: 'o1-mini', label: 'o1 Mini', maker: 'OpenAI' },
        { value: 'custom', label: '✏️ Custom Model...', maker: 'Custom' },
      ],
      embedding: [
        { value: 'text-embedding-3-small', label: 'text-embedding-3-small', maker: 'OpenAI', recommended: true },
        { value: 'text-embedding-3-large', label: 'text-embedding-3-large', maker: 'OpenAI' },
        { value: 'text-embedding-ada-002', label: 'text-embedding-ada-002', maker: 'OpenAI' },
        { value: 'custom', label: '✏️ Custom Model...', maker: 'Custom' },
      ],
    },
    anthropic: {
      chat: [
        { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', maker: 'Anthropic', recommended: true },
        { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus', maker: 'Anthropic' },
        { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet', maker: 'Anthropic' },
        { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku', maker: 'Anthropic' },
        { value: 'custom', label: '✏️ Custom Model...', maker: 'Custom' },
      ],
      embedding: [
        { value: 'text-embedding-3-small', label: 'text-embedding-3-small (via OpenRouter)', maker: 'OpenAI', recommended: true },
        { value: 'custom', label: '✏️ Custom Model...', maker: 'Custom' },
      ],
    },
    platform_default: {
      chat: [{ value: 'openai/gpt-4o', label: 'GPT-4o (Platform Default)', maker: 'OpenAI', recommended: true }],
      embedding: [{ value: 'text-embedding-3-small', label: 'text-embedding-3-small', maker: 'OpenAI', recommended: true }],
    },
  };

  // Filter models based on search query
  const filterModels = (models: typeof modelOptions.openrouter.chat, filter: string) => {
    if (!filter) return models;
    const lowerFilter = filter.toLowerCase();
    return models.filter(
      (m) =>
        m.label.toLowerCase().includes(lowerFilter) ||
        m.value.toLowerCase().includes(lowerFilter) ||
        m.maker.toLowerCase().includes(lowerFilter)
    );
  };

  // Group models by maker
  const groupByMaker = (models: typeof modelOptions.openrouter.chat) => {
    const grouped: Record<string, typeof modelOptions.openrouter.chat> = {};
    models.forEach((model) => {
      if (!grouped[model.maker]) {
        grouped[model.maker] = [];
      }
      grouped[model.maker].push(model);
    });
    return grouped;
  };

  const currentModels = modelOptions[provider];
  const filteredChatModels = filterModels(currentModels.chat, chatModelFilter);
  const filteredEmbeddingModels = filterModels(currentModels.embedding, embeddingModelFilter);
  const groupedChatModels = groupByMaker(filteredChatModels);
  const groupedEmbeddingModels = groupByMaker(filteredEmbeddingModels);

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
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Chat Model
          </label>
          {provider === 'openrouter' && (
            <a
              href="https://openrouter.ai/models"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Browse all models ↗
            </a>
          )}
        </div>

        {/* Filter Input */}
        <input
          type="text"
          value={chatModelFilter}
          onChange={(e) => setChatModelFilter(e.target.value)}
          placeholder="🔍 Search models by name, maker, or ID..."
          className="w-full px-3 py-2 mb-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          disabled={isPending}
        />

        {/* Model Dropdown with Groups */}
        <select
          value={chatModel}
          onChange={(e) => setChatModel(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isPending}
          size={chatModelFilter ? Math.min(filteredChatModels.length + Object.keys(groupedChatModels).length, 10) : undefined}
        >
          {Object.entries(groupedChatModels).map(([maker, models]) => (
            <optgroup key={maker} label={`${maker} (${models.length})`}>
              {models.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label} {model.recommended ? '⭐' : ''}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        {chatModel === 'custom' && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">Enter Model ID</p>
            <input
              type="text"
              value={customChatModel}
              onChange={(e) => setCustomChatModel(e.target.value)}
              placeholder={provider === 'openrouter' ? 'e.g., openai/gpt-5-mini' : 'e.g., gpt-4o'}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              disabled={isPending}
            />
            <p className="mt-2 text-xs text-blue-700">
              {provider === 'openrouter' && (
                <>
                  Find the exact model ID at{' '}
                  <a href="https://openrouter.ai/models" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                    openrouter.ai/models ↗
                  </a>
                  {' '}(includes newly released models)
                </>
              )}
              {provider === 'openai' && 'See available models at platform.openai.com/docs/models'}
              {provider === 'anthropic' && 'See available models at docs.anthropic.com/en/docs/models-overview'}
            </p>
          </div>
        )}

        <p className="mt-2 text-sm text-gray-500">
          Used for lead research, qualification, and email generation
          {chatModelFilter && ` • Showing ${filteredChatModels.length} of ${currentModels.chat.length} models`}
        </p>
      </div>

      {/* Embedding Model */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Embedding Model
          </label>
          {provider === 'openrouter' && (
            <a
              href="https://openrouter.ai/models?type=embedding"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Browse embedding models ↗
            </a>
          )}
        </div>

        {/* Filter Input */}
        <input
          type="text"
          value={embeddingModelFilter}
          onChange={(e) => setEmbeddingModelFilter(e.target.value)}
          placeholder="🔍 Search embedding models..."
          className="w-full px-3 py-2 mb-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          disabled={isPending}
        />

        {/* Model Dropdown with Groups */}
        <select
          value={embeddingModel}
          onChange={(e) => setEmbeddingModel(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isPending}
          size={embeddingModelFilter ? Math.min(filteredEmbeddingModels.length + Object.keys(groupedEmbeddingModels).length, 8) : undefined}
        >
          {Object.entries(groupedEmbeddingModels).map(([maker, models]) => (
            <optgroup key={maker} label={`${maker} (${models.length})`}>
              {models.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label} {model.recommended ? '⭐' : ''}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        {embeddingModel === 'custom' && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">Enter Embedding Model ID</p>
            <input
              type="text"
              value={customEmbeddingModel}
              onChange={(e) => setCustomEmbeddingModel(e.target.value)}
              placeholder="e.g., openai/text-embedding-3-small"
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              disabled={isPending}
            />
            <p className="mt-2 text-xs text-blue-700">
              {provider === 'openrouter' && (
                <>
                  Find the exact model ID at{' '}
                  <a href="https://openrouter.ai/models?type=embedding" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                    openrouter.ai/models ↗
                  </a>
                  {' '}(includes newly released models)
                </>
              )}
              {provider === 'openai' && 'See available models at platform.openai.com/docs/models'}
              {provider === 'anthropic' && 'Note: Anthropic doesn\'t provide embedding models, use OpenAI via OpenRouter'}
            </p>
          </div>
        )}

        <p className="mt-2 text-sm text-gray-500">
          Used for knowledge base search
          {embeddingModelFilter && ` • Showing ${filteredEmbeddingModels.length} of ${currentModels.embedding.length} models`}
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
