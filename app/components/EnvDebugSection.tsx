import { useEffect, useState } from "react";

const basePath = (import.meta.env.BASE_URL || "").replace(/\/$/, "");

interface BackendEnvResponse {
  timestamp: string;
  environment: string;
  total: number;
  filtered: number;
  hidden: number;
  envVarNames: string[];
}

interface Props {
  compact?: boolean;
}

export default function EnvDebugSection({ compact }: Props) {
  const [backendEnv, setBackendEnv] = useState<BackendEnvResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Get frontend env var names from import.meta.env
  const frontendEnvNames = Object.keys(import.meta.env || {})
    .filter((name) => name.startsWith("VITE_") || ["MODE", "DEV", "PROD", "SSR", "BASE_URL"].includes(name))
    .sort();

  useEffect(() => {
    async function fetchBackendEnv() {
      try {
        const res = await fetch(`${basePath}/api/env-debug`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as BackendEnvResponse;
        setBackendEnv(data);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch");
      } finally {
        setLoading(false);
      }
    }

    fetchBackendEnv();
  }, []);

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 ${compact ? "p-3" : "p-6"}`}>
        <h3 className={`font-bold text-gray-900 dark:text-white flex items-center gap-2 ${compact ? "text-sm mb-2" : "text-lg mb-4"}`}>
          <span>Env Debug</span>
        </h3>
        <div className="animate-pulse flex gap-3">
          <div className={`bg-gray-200 dark:bg-gray-700 rounded ${compact ? "h-10 flex-1" : "h-16 flex-1"}`} />
          <div className={`bg-gray-200 dark:bg-gray-700 rounded ${compact ? "h-10 flex-1" : "h-16 flex-1"}`} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-lg border border-red-200 dark:border-red-800 ${compact ? "p-3" : "p-6"}`}>
        <h3 className={`font-bold text-gray-900 dark:text-white flex items-center gap-2 ${compact ? "text-sm mb-1" : "text-lg mb-2"}`}>
          <span>Env Debug</span>
        </h3>
        <p className={`text-red-600 dark:text-red-400 ${compact ? "text-xs" : "text-sm"}`}>
          {error}
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-left"
        >
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-between">
            <span className="flex items-center gap-2">
              Env Debug
              <span className="text-xs font-normal text-gray-400">(Names Only)</span>
            </span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </h3>
        </button>
        <div className="flex gap-2">
          <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/30 rounded flex-1">
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {frontendEnvNames.length}
            </p>
            <p className="text-xs text-gray-500">Frontend</p>
          </div>
          <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/30 rounded flex-1">
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {backendEnv?.filtered || 0}
            </p>
            <p className="text-xs text-gray-500">Backend</p>
          </div>
        </div>
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Frontend ({frontendEnvNames.length})</h4>
              <div className="flex flex-wrap gap-1">
                {frontendEnvNames.map((name) => (
                  <span
                    key={name}
                    className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded font-mono"
                  >
                    {name}
                  </span>
                ))}
                {frontendEnvNames.length === 0 && (
                  <span className="text-xs text-gray-400 italic">None available</span>
                )}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">
                Backend ({backendEnv?.filtered || 0})
                {backendEnv && backendEnv.hidden > 0 && (
                  <span className="text-gray-400 font-normal"> - {backendEnv.hidden} hidden</span>
                )}
              </h4>
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                {backendEnv?.envVarNames.map((name) => (
                  <span
                    key={name}
                    className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded font-mono"
                  >
                    {name}
                  </span>
                ))}
                {(!backendEnv || backendEnv.envVarNames.length === 0) && (
                  <span className="text-xs text-gray-400 italic">None available</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span>Environment Variables Debug</span>
        <span className="text-xs font-normal text-gray-400">(Names Only)</span>
      </h3>
      <div className="flex gap-6 mb-6">
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex-1">
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {frontendEnvNames.length}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Frontend Vars</p>
        </div>
        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg flex-1">
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {backendEnv?.filtered || 0}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Backend Vars</p>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">Frontend Environment</h4>
          <div className="flex flex-wrap gap-2">
            {frontendEnvNames.map((name) => (
              <span
                key={name}
                className="text-sm px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded font-mono"
              >
                {name}
              </span>
            ))}
            {frontendEnvNames.length === 0 && (
              <span className="text-sm text-gray-400 italic">No frontend env vars available</span>
            )}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-2">
            Backend Environment
            {backendEnv && backendEnv.hidden > 0 && (
              <span className="text-gray-400 font-normal ml-2">({backendEnv.hidden} sensitive vars hidden)</span>
            )}
          </h4>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
            {backendEnv?.envVarNames.map((name) => (
              <span
                key={name}
                className="text-sm px-2 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded font-mono"
              >
                {name}
              </span>
            ))}
            {(!backendEnv || backendEnv.envVarNames.length === 0) && (
              <span className="text-sm text-gray-400 italic">No backend env vars available</span>
            )}
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
        Shows env var names only (not values) for debugging. Sensitive vars (containing SECRET, KEY, TOKEN, etc.) are hidden.
      </p>
    </div>
  );
}
