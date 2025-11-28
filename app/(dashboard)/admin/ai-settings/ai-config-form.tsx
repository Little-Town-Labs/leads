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

  // Comprehensive model options organized by maker - Full OpenRouter catalog
  const modelOptions = {
    openrouter: {
      chat: [
        // Anthropic Claude
        { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet', maker: 'Anthropic', recommended: true },
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

        // Meta Llama
        { value: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B Instruct', maker: 'Meta' },
        { value: 'meta-llama/llama-3.2-90b-vision-instruct', label: 'Llama 3.2 90B Vision', maker: 'Meta' },
        { value: 'meta-llama/llama-3.2-11b-vision-instruct', label: 'Llama 3.2 11B Vision', maker: 'Meta' },
        { value: 'meta-llama/llama-3.2-3b-instruct', label: 'Llama 3.2 3B Instruct', maker: 'Meta' },
        { value: 'meta-llama/llama-3.2-1b-instruct', label: 'Llama 3.2 1B Instruct', maker: 'Meta' },
        { value: 'meta-llama/llama-3.1-405b-instruct', label: 'Llama 3.1 405B Instruct', maker: 'Meta' },
        { value: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B Instruct', maker: 'Meta' },
        { value: 'meta-llama/llama-3.1-8b-instruct', label: 'Llama 3.1 8B Instruct', maker: 'Meta' },
        { value: 'meta-llama/llama-3-70b-instruct', label: 'Llama 3 70B Instruct', maker: 'Meta' },
        { value: 'meta-llama/llama-3-8b-instruct', label: 'Llama 3 8B Instruct', maker: 'Meta' },
        { value: 'meta-llama/llama-2-70b-chat', label: 'Llama 2 70B Chat', maker: 'Meta' },
        { value: 'meta-llama/llama-2-13b-chat', label: 'Llama 2 13B Chat', maker: 'Meta' },
        { value: 'meta-llama/llama-2-7b-chat', label: 'Llama 2 7B Chat', maker: 'Meta' },

        // DeepSeek
        { value: 'deepseek/deepseek-r1', label: 'DeepSeek R1', maker: 'DeepSeek' },
        { value: 'deepseek/deepseek-chat', label: 'DeepSeek Chat', maker: 'DeepSeek' },
        { value: 'deepseek/deepseek-coder', label: 'DeepSeek Coder', maker: 'DeepSeek' },

        // Mistral
        { value: 'mistralai/mistral-large', label: 'Mistral Large', maker: 'Mistral' },
        { value: 'mistralai/mistral-large-2407', label: 'Mistral Large 2407', maker: 'Mistral' },
        { value: 'mistralai/mistral-medium', label: 'Mistral Medium', maker: 'Mistral' },
        { value: 'mistralai/mistral-small', label: 'Mistral Small', maker: 'Mistral' },
        { value: 'mistralai/mistral-tiny', label: 'Mistral Tiny', maker: 'Mistral' },
        { value: 'mistralai/mistral-7b-instruct', label: 'Mistral 7B Instruct', maker: 'Mistral' },
        { value: 'mistralai/mixtral-8x7b-instruct', label: 'Mixtral 8x7B Instruct', maker: 'Mistral' },
        { value: 'mistralai/mixtral-8x22b-instruct', label: 'Mixtral 8x22B Instruct', maker: 'Mistral' },
        { value: 'mistralai/codestral-mamba', label: 'Codestral Mamba', maker: 'Mistral' },
        { value: 'mistralai/pixtral-12b', label: 'Pixtral 12B', maker: 'Mistral' },

        // Cohere
        { value: 'cohere/command-r-plus', label: 'Command R+', maker: 'Cohere' },
        { value: 'cohere/command-r-plus-08-2024', label: 'Command R+ (08-2024)', maker: 'Cohere' },
        { value: 'cohere/command-r', label: 'Command R', maker: 'Cohere' },
        { value: 'cohere/command-r-08-2024', label: 'Command R (08-2024)', maker: 'Cohere' },
        { value: 'cohere/command', label: 'Command', maker: 'Cohere' },
        { value: 'cohere/command-light', label: 'Command Light', maker: 'Cohere' },

        // Qwen (Alibaba)
        { value: 'qwen/qwen-2.5-72b-instruct', label: 'Qwen 2.5 72B Instruct', maker: 'Qwen' },
        { value: 'qwen/qwen-2.5-32b-instruct', label: 'Qwen 2.5 32B Instruct', maker: 'Qwen' },
        { value: 'qwen/qwen-2.5-14b-instruct', label: 'Qwen 2.5 14B Instruct', maker: 'Qwen' },
        { value: 'qwen/qwen-2.5-7b-instruct', label: 'Qwen 2.5 7B Instruct', maker: 'Qwen' },
        { value: 'qwen/qwen-2.5-coder-32b-instruct', label: 'Qwen 2.5 Coder 32B', maker: 'Qwen' },
        { value: 'qwen/qwen-2-72b-instruct', label: 'Qwen 2 72B Instruct', maker: 'Qwen' },
        { value: 'qwen/qwen-2-7b-instruct', label: 'Qwen 2 7B Instruct', maker: 'Qwen' },
        { value: 'qwen/qwen-1.5-110b-chat', label: 'Qwen 1.5 110B Chat', maker: 'Qwen' },
        { value: 'qwen/qwen-1.5-72b-chat', label: 'Qwen 1.5 72B Chat', maker: 'Qwen' },

        // xAI (X.AI)
        { value: 'x-ai/grok-beta', label: 'Grok Beta', maker: 'xAI' },
        { value: 'x-ai/grok-vision-beta', label: 'Grok Vision Beta', maker: 'xAI' },

        // Perplexity
        { value: 'perplexity/llama-3.1-sonar-huge-128k-online', label: 'Sonar Huge 128k (Online)', maker: 'Perplexity' },
        { value: 'perplexity/llama-3.1-sonar-large-128k-online', label: 'Sonar Large 128k (Online)', maker: 'Perplexity' },
        { value: 'perplexity/llama-3.1-sonar-large-128k-chat', label: 'Sonar Large 128k (Chat)', maker: 'Perplexity' },
        { value: 'perplexity/llama-3.1-sonar-small-128k-online', label: 'Sonar Small 128k (Online)', maker: 'Perplexity' },
        { value: 'perplexity/llama-3.1-sonar-small-128k-chat', label: 'Sonar Small 128k (Chat)', maker: 'Perplexity' },

        // Microsoft
        { value: 'microsoft/phi-3-medium-128k-instruct', label: 'Phi-3 Medium 128k', maker: 'Microsoft' },
        { value: 'microsoft/phi-3-mini-128k-instruct', label: 'Phi-3 Mini 128k', maker: 'Microsoft' },
        { value: 'microsoft/wizardlm-2-8x22b', label: 'WizardLM-2 8x22B', maker: 'Microsoft' },
        { value: 'microsoft/wizardlm-2-7b', label: 'WizardLM-2 7B', maker: 'Microsoft' },

        // Amazon
        { value: 'amazon/nova-pro-v1', label: 'Nova Pro v1', maker: 'Amazon' },
        { value: 'amazon/nova-lite-v1', label: 'Nova Lite v1', maker: 'Amazon' },
        { value: 'amazon/nova-micro-v1', label: 'Nova Micro v1', maker: 'Amazon' },

        // AI21 Labs
        { value: 'ai21/jamba-1-5-large', label: 'Jamba 1.5 Large', maker: 'AI21' },
        { value: 'ai21/jamba-1-5-mini', label: 'Jamba 1.5 Mini', maker: 'AI21' },

        // Nous Research
        { value: 'nousresearch/hermes-3-llama-3.1-405b', label: 'Hermes 3 Llama 3.1 405B', maker: 'Nous Research' },
        { value: 'nousresearch/hermes-2-pro-llama-3-8b', label: 'Hermes 2 Pro Llama 3 8B', maker: 'Nous Research' },
        { value: 'nousresearch/nous-capybara-7b', label: 'Nous Capybara 7B', maker: 'Nous Research' },

        // Databricks
        { value: 'databricks/dbrx-instruct', label: 'DBRX Instruct', maker: 'Databricks' },

        // Inflection
        { value: 'inflection/inflection-3-pi', label: 'Inflection 3 Pi', maker: 'Inflection' },
        { value: 'inflection/inflection-3-productivity', label: 'Inflection 3 Productivity', maker: 'Inflection' },

        // 01.AI
        { value: '01-ai/yi-large', label: 'Yi Large', maker: '01.AI' },
        { value: '01-ai/yi-large-turbo', label: 'Yi Large Turbo', maker: '01.AI' },
        { value: '01-ai/yi-34b-chat', label: 'Yi 34B Chat', maker: '01.AI' },

        // Anthropic (Legacy)
        { value: 'anthropic/claude-1', label: 'Claude 1', maker: 'Anthropic' },
        { value: 'anthropic/claude-1.2', label: 'Claude 1.2', maker: 'Anthropic' },

        // OpenAI (Legacy)
        { value: 'openai/gpt-3.5-turbo-instruct', label: 'GPT-3.5 Turbo Instruct', maker: 'OpenAI' },

        // Custom
        { value: 'custom', label: '✏️ Custom Model...', maker: 'Custom' },
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Chat Model
        </label>

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

        <p className="mt-2 text-sm text-gray-500">
          Used for lead research, qualification, and email generation
          {chatModelFilter && ` • Showing ${filteredChatModels.length} of ${currentModels.chat.length} models`}
        </p>
      </div>

      {/* Embedding Model */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Embedding Model
        </label>

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
