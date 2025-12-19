'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings,
  ArrowLeft,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Info,
  Save,
} from 'lucide-react';

interface ApiKeyConfig {
  key: string;
  label: string;
  description: string;
  required: boolean;
  envVar: string;
  docsUrl?: string;
  placeholder?: string;
  category: 'auth' | 'ai' | 'data' | 'optional';
}

const API_KEYS: ApiKeyConfig[] = [
  // Auth
  {
    key: 'nextauth_secret',
    label: 'NextAuth Secret',
    description: 'Geheimer Schlüssel für Session-Verschlüsselung. Generiere mit: openssl rand -base64 32',
    required: true,
    envVar: 'NEXTAUTH_SECRET',
    category: 'auth',
    placeholder: 'abc123...',
  },
  {
    key: 'nextauth_url',
    label: 'NextAuth URL',
    description: 'Basis-URL deiner App (z.B. http://localhost:3000 für Entwicklung)',
    required: true,
    envVar: 'NEXTAUTH_URL',
    category: 'auth',
    placeholder: 'http://localhost:3000',
  },
  {
    key: 'google_client_id',
    label: 'Google Client ID',
    description: 'OAuth Client ID von der Google Cloud Console',
    required: false,
    envVar: 'GOOGLE_CLIENT_ID',
    docsUrl: 'https://console.cloud.google.com/apis/credentials',
    category: 'auth',
    placeholder: '123456789-abc.apps.googleusercontent.com',
  },
  {
    key: 'google_client_secret',
    label: 'Google Client Secret',
    description: 'OAuth Client Secret von der Google Cloud Console',
    required: false,
    envVar: 'GOOGLE_CLIENT_SECRET',
    docsUrl: 'https://console.cloud.google.com/apis/credentials',
    category: 'auth',
    placeholder: 'GOCSPX-...',
  },
  {
    key: 'twitter_client_id',
    label: 'Twitter/X Client ID',
    description: 'OAuth 2.0 Client ID vom Twitter Developer Portal',
    required: false,
    envVar: 'TWITTER_CLIENT_ID',
    docsUrl: 'https://developer.twitter.com/en/portal/dashboard',
    category: 'auth',
    placeholder: 'abc123...',
  },
  {
    key: 'twitter_client_secret',
    label: 'Twitter/X Client Secret',
    description: 'OAuth 2.0 Client Secret vom Twitter Developer Portal',
    required: false,
    envVar: 'TWITTER_CLIENT_SECRET',
    docsUrl: 'https://developer.twitter.com/en/portal/dashboard',
    category: 'auth',
    placeholder: 'xyz789...',
  },
  // AI
  {
    key: 'groq_api_key',
    label: 'Groq API Key',
    description: 'Primary: API Key für Groq AI (schnell & kostengünstig)',
    required: false,
    envVar: 'GROQ_API_KEY',
    docsUrl: 'https://console.groq.com/keys',
    category: 'ai',
    placeholder: 'gsk_...',
  },
  {
    key: 'openai_api_key',
    label: 'OpenAI API Key',
    description: 'Fallback: API Key für OpenAI GPT-4 (höhere Qualität, teurer)',
    required: false,
    envVar: 'OPENAI_API_KEY',
    docsUrl: 'https://platform.openai.com/api-keys',
    category: 'ai',
    placeholder: 'sk-proj-...',
  },
  // Data APIs
  {
    key: 'coingecko_api_key',
    label: 'CoinGecko API Key',
    description: 'Optional: Pro API Key für höhere Rate Limits',
    required: false,
    envVar: 'COINGECKO_API_KEY',
    docsUrl: 'https://www.coingecko.com/en/api/pricing',
    category: 'data',
    placeholder: 'CG-...',
  },
];

const CATEGORIES = {
  auth: { label: 'Authentifizierung', icon: Key },
  ai: { label: 'KI-Services', icon: Settings },
  data: { label: 'Daten-APIs', icon: ExternalLink },
  optional: { label: 'Optional', icon: Info },
};

export default function SettingsPage() {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [envStatus, setEnvStatus] = useState<Record<string, boolean>>({});

  // Load saved values from localStorage
  useEffect(() => {
    const savedValues = localStorage.getItem('crypto-intelligence-settings');
    if (savedValues) {
      try {
        setValues(JSON.parse(savedValues));
      } catch {
        // Invalid JSON, ignore
      }
    }

    // Check which env vars are configured (via API)
    checkEnvStatus();
  }, []);

  const checkEnvStatus = async () => {
    try {
      const res = await fetch('/api/settings/status');
      const data = await res.json();
      if (data.success) {
        setEnvStatus(data.status);
      }
    } catch {
      // API might not exist yet
    }
  };

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('crypto-intelligence-settings', JSON.stringify(values));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleShowSecret = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const copyEnvTemplate = () => {
    const template = API_KEYS.map((config) => {
      const value = values[config.key] || config.placeholder || '';
      return `${config.envVar}=${value}`;
    }).join('\n');

    navigator.clipboard.writeText(template);
    setCopied('template');
    setTimeout(() => setCopied(null), 2000);
  };

  const copyValue = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const groupedKeys = API_KEYS.reduce((acc, config) => {
    if (!acc[config.category]) {
      acc[config.category] = [];
    }
    acc[config.category].push(config);
    return acc;
  }, {} as Record<string, ApiKeyConfig[]>);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 sticky top-0 bg-gray-950/95 backdrop-blur z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Settings className="w-6 h-6 text-gray-400" />
              <div>
                <h1 className="text-lg font-bold">Einstellungen</h1>
                <p className="text-[10px] text-gray-500">API Keys & Konfiguration</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyEnvTemplate}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs transition-colors"
              >
                {copied === 'template' ? (
                  <Check className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                .env kopieren
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-medium transition-colors"
              >
                {saved ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                {saved ? 'Gespeichert!' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4">
        {/* Info Banner */}
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-blue-200 font-medium mb-1">Hinweis zur Konfiguration</p>
              <p className="text-blue-300/80">
                API Keys sollten in der <code className="px-1 py-0.5 bg-blue-500/20 rounded text-xs">.env.local</code> Datei
                im Projektverzeichnis gespeichert werden. Die hier eingegebenen Werte werden lokal im Browser gespeichert
                und können als Vorlage für die .env.local Datei kopiert werden.
              </p>
            </div>
          </div>
        </div>

        {/* API Key Sections */}
        {Object.entries(groupedKeys).map(([category, keys]) => {
          const CategoryIcon = CATEGORIES[category as keyof typeof CATEGORIES]?.icon || Key;
          const categoryLabel = CATEGORIES[category as keyof typeof CATEGORIES]?.label || category;

          return (
            <div key={category} className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <CategoryIcon className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold">{categoryLabel}</h2>
              </div>

              <div className="space-y-4">
                {keys.map((config) => {
                  const isConfigured = envStatus[config.envVar];
                  const hasValue = !!values[config.key];

                  return (
                    <div
                      key={config.key}
                      className="bg-gray-900/50 border border-gray-800 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{config.label}</span>
                          {config.required && (
                            <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded">
                              Erforderlich
                            </span>
                          )}
                          {isConfigured && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded">
                              <CheckCircle className="w-3 h-3" />
                              Konfiguriert
                            </span>
                          )}
                        </div>
                        {config.docsUrl && (
                          <a
                            href={config.docsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Docs
                          </a>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 mb-3">{config.description}</p>

                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <input
                            type={showSecrets[config.key] ? 'text' : 'password'}
                            value={values[config.key] || ''}
                            onChange={(e) => handleChange(config.key, e.target.value)}
                            placeholder={config.placeholder}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500 font-mono"
                          />
                          <button
                            onClick={() => toggleShowSecret(config.key)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-400"
                          >
                            {showSecrets[config.key] ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <button
                          onClick={() => copyValue(config.key, `${config.envVar}=${values[config.key] || ''}`)}
                          disabled={!values[config.key]}
                          className="px-3 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                        >
                          {copied === config.key ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <div className="mt-2 text-[10px] text-gray-600 font-mono">
                        {config.envVar}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* .env.local Template */}
        <div className="mt-8 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Copy className="w-5 h-5 text-gray-400" />
            .env.local Vorlage
          </h2>

          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 border-b border-gray-700">
              <span className="text-xs text-gray-400 font-mono">.env.local</span>
              <button
                onClick={copyEnvTemplate}
                className="flex items-center gap-1.5 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
              >
                {copied === 'template' ? (
                  <>
                    <Check className="w-3 h-3 text-green-400" />
                    Kopiert!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Kopieren
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-gray-300 overflow-x-auto">
              {API_KEYS.map((config) => {
                const value = values[config.key] || `<${config.label}>`;
                return `${config.envVar}=${value}`;
              }).join('\n')}
            </pre>
          </div>
        </div>

        {/* Quick Setup Guide */}
        <div className="mb-8 p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-400" />
            Schnellstart-Anleitung
          </h3>
          <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
            <li>
              Erstelle eine <code className="px-1 py-0.5 bg-gray-800 rounded text-xs">.env.local</code> Datei im Projektverzeichnis
            </li>
            <li>Trage die API Keys oben ein und kopiere die Vorlage</li>
            <li>Füge die Vorlage in die .env.local Datei ein</li>
            <li>
              Starte den Dev-Server neu: <code className="px-1 py-0.5 bg-gray-800 rounded text-xs">npm run dev</code>
            </li>
          </ol>
        </div>
      </main>
    </div>
  );
}
