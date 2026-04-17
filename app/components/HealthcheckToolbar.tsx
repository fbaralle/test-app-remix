import { useEffect, useState } from "react";

const basePath = import.meta.env.APP_PUBLIC_API_PATH || "";

interface ServiceStatus {
  status: "ok" | "error";
  latency: number;
  error?: string;
}

interface HealthcheckResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  services: {
    d1: ServiceStatus;
    kv_sessions: ServiceStatus;
    kv_flags: ServiceStatus;
    r2: ServiceStatus;
  };
}

type ServiceName = "d1" | "kv_sessions" | "kv_flags" | "r2";

interface ServiceConfig {
  label: string;
  type: string;
  binding: string;
  description: string;
  icon: string;
  details: Record<string, string>;
}

const SERVICE_CONFIG: Record<ServiceName, ServiceConfig> = {
  d1: {
    label: "D1 Database",
    type: "D1",
    binding: "DB",
    description: "SQLite database for persistent storage",
    icon: "🗄️",
    details: {
      "Database Name": "db",
      "Migrations Dir": "drizzle",
    },
  },
  kv_sessions: {
    label: "KV Sessions",
    type: "KV",
    binding: "SESSIONS",
    description: "Key-value store for session data",
    icon: "🔑",
    details: {
      "Namespace ID": "local",
      Purpose: "User sessions",
    },
  },
  kv_flags: {
    label: "KV Flags",
    type: "KV",
    binding: "FLAGS",
    description: "Key-value store for feature flags",
    icon: "🚩",
    details: {
      "Namespace ID": "local-flags",
      Purpose: "Feature flags",
    },
  },
  r2: {
    label: "R2 Storage",
    type: "R2",
    binding: "MEDIA",
    description: "Object storage for files and media",
    icon: "📦",
    details: {
      "Bucket Name": "media",
      Purpose: "Media storage",
    },
  },
};

function StatusIndicator({
  status,
  size = "md",
}: {
  status: "ok" | "error" | "loading";
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  const colors = {
    ok: "bg-green-500 shadow-green-500/50",
    error: "bg-red-500 shadow-red-500/50",
    loading: "bg-yellow-500 shadow-yellow-500/50 animate-pulse",
  };

  return (
    <span
      className={`inline-block rounded-full shadow-lg ${sizeClasses[size]} ${colors[status]}`}
      aria-label={status}
    />
  );
}

function Tooltip({
  children,
  content,
}: {
  children: React.ReactNode;
  content: React.ReactNode;
}) {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[60] pointer-events-none">
          <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-3 text-sm min-w-[200px]">
            {content}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
            <div className="border-8 border-transparent border-t-gray-800" />
          </div>
        </div>
      )}
    </div>
  );
}

function ServiceCard({
  serviceKey,
  config,
  status,
  loading,
}: {
  serviceKey: ServiceName;
  config: ServiceConfig;
  status?: ServiceStatus;
  loading: boolean;
}) {
  const currentStatus = loading ? "loading" : status?.status || "error";

  const tooltipContent = (
    <div className="space-y-2">
      <div className="font-semibold text-white">{config.label}</div>
      <div className="text-gray-400 text-xs">{config.description}</div>
      <div className="border-t border-gray-700 pt-2 space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Binding:</span>
          <span className="text-gray-300 font-mono">{config.binding}</span>
        </div>
        {Object.entries(config.details).map(([key, value]) => (
          <div key={key} className="flex justify-between text-xs">
            <span className="text-gray-500">{key}:</span>
            <span className="text-gray-300 font-mono">{value}</span>
          </div>
        ))}
        {status && (
          <>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Latency:</span>
              <span className="text-gray-300">{status.latency}ms</span>
            </div>
            {status.error && (
              <div className="text-xs text-red-400 mt-1">
                Error: {status.error}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <Tooltip content={tooltipContent}>
      <div
        className={`
          flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
          ${
            currentStatus === "error"
              ? "bg-red-500/10 border border-red-500/30 hover:bg-red-500/20"
              : currentStatus === "loading"
                ? "bg-yellow-500/10 border border-yellow-500/30"
                : "bg-green-500/10 border border-green-500/30 hover:bg-green-500/20"
          }
        `}
      >
        <div className="text-2xl">{config.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white truncate">
              {config.label}
            </span>
            <StatusIndicator status={currentStatus} size="sm" />
          </div>
          <div className="text-xs text-gray-400 font-mono truncate">
            {config.binding}
          </div>
        </div>
        {status && !loading && (
          <div className="text-xs text-gray-500">{status.latency}ms</div>
        )}
      </div>
    </Tooltip>
  );
}

export default function HealthcheckToolbar() {
  const [health, setHealth] = useState<HealthcheckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    async function fetchHealth() {
      try {
        const res = await fetch(`${basePath}/api/binding-status`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as HealthcheckResponse;
        setHealth(data);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch");
      } finally {
        setLoading(false);
      }
    }

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const overallStatus = loading
    ? "loading"
    : health?.status === "healthy"
      ? "ok"
      : "error";

  const statusColors = {
    healthy: "text-green-400 bg-green-500/20 border-green-500/30",
    degraded: "text-yellow-400 bg-yellow-500/20 border-yellow-500/30",
    unhealthy: "text-red-400 bg-red-500/20 border-red-500/30",
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gray-900/95 backdrop-blur-lg border border-gray-700 rounded-xl shadow-2xl min-w-[320px] max-w-[380px]">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <StatusIndicator status={overallStatus} size="lg" />
            <div className="text-left">
              <div className="text-sm font-semibold text-white">
                Cloudflare Bindings
              </div>
              <div className="text-xs text-gray-400">
                {loading
                  ? "Checking..."
                  : error
                    ? "Connection error"
                    : `${Object.values(health?.services || {}).filter((s) => s.status === "ok").length}/4 services online`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {health && (
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full border ${statusColors[health.status]}`}
              >
                {health.status.toUpperCase()}
              </span>
            )}
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="px-4 pb-4 space-y-2">
            {error && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            {(Object.keys(SERVICE_CONFIG) as ServiceName[]).map((key) => (
              <ServiceCard
                key={key}
                serviceKey={key}
                config={SERVICE_CONFIG[key]}
                status={health?.services[key]}
                loading={loading}
              />
            ))}

            {health && (
              <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-800">
                Last checked:{" "}
                {new Date(health.timestamp).toLocaleTimeString()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
