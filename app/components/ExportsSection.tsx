import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFavorites } from "./FavoritesSection";

const basePath = import.meta.env.APP_PUBLIC_API_PATH || "";

interface Export {
  key: string;
  size: number;
  uploaded: string;
}

interface ExportsResponse {
  exports: Export[];
  error?: string;
}

interface ExportResult {
  success: boolean;
  id: string;
  url: string;
}

async function fetchExports(): Promise<Export[]> {
  const res = await fetch(`${basePath}/api/export`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as ExportsResponse;
  if (data.error) throw new Error(data.error);
  return data.exports;
}

async function createExport(data: unknown): Promise<ExportResult> {
  const res = await fetch(`${basePath}/api/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  compact?: boolean;
}

export default function ExportsSection({ compact }: Props) {
  const queryClient = useQueryClient();
  const { data: favorites } = useFavorites();
  const { data: exports = [], isLoading, error } = useQuery({
    queryKey: ["exports"],
    queryFn: fetchExports,
    staleTime: 30000,
    retry: false,
  });

  const exportMutation = useMutation({
    mutationFn: createExport,
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exports"] });
    },
  });

  const handleExportFavorites = () => {
    exportMutation.mutate({
      type: "favorites",
      title: "Favorites Export",
      exportedAt: new Date().toISOString(),
      favorites: favorites || [],
    });
  };

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 ${compact ? "p-3" : "p-6"}`}>
        <h3 className={`font-bold text-gray-900 dark:text-white flex items-center gap-2 ${compact ? "text-sm mb-2" : "text-lg mb-4"}`}>
          <span>R2 Exports</span>
        </h3>
        <div className="animate-pulse space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className={`bg-gray-200 dark:bg-gray-700 rounded ${compact ? "h-6" : "h-12"}`} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-lg border border-red-200 dark:border-red-800 ${compact ? "p-3" : "p-6"}`}>
        <h3 className={`font-bold text-gray-900 dark:text-white flex items-center gap-2 ${compact ? "text-sm mb-1" : "text-lg mb-2"}`}>
          <span>R2 Exports</span>
        </h3>
        <p className={`text-red-600 dark:text-red-400 ${compact ? "text-xs" : "text-sm"}`}>
          {error instanceof Error ? error.message : "Failed"}
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>Exports</span>
            <span className="text-xs font-normal text-gray-400">(R2)</span>
          </h3>
          <button
            onClick={handleExportFavorites}
            disabled={exportMutation.isPending || !favorites?.length}
            className="px-2 py-1 text-xs font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportMutation.isPending ? "..." : "Export"}
          </button>
        </div>
        <div className="space-y-1">
          {exports.length === 0 ? (
            <p className="text-xs text-gray-500">No exports yet</p>
          ) : (
            exports.slice(0, 2).map((exp) => (
              <div key={exp.key} className="flex items-center justify-between text-xs">
                <span className="text-gray-700 dark:text-gray-300 truncate flex-1">
                  {exp.key.replace("exports/", "").slice(0, 15)}...
                </span>
                <span className="text-gray-400 ml-2">{formatBytes(exp.size)}</span>
              </div>
            ))
          )}
          {exports.length > 2 && (
            <p className="text-xs text-gray-400">+{exports.length - 2} more</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span>R2 Exports</span>
        </h3>
        <button
          onClick={handleExportFavorites}
          disabled={exportMutation.isPending || !favorites?.length}
          className="px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {exportMutation.isPending ? "Exporting..." : "Export Favorites"}
        </button>
      </div>

      {exportMutation.isSuccess && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-400">
            Export created: <code className="font-mono">{exportMutation.data?.id}</code>
          </p>
        </div>
      )}

      {exports.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No exports yet. Click &quot;Export Favorites&quot; to create one.
        </p>
      ) : (
        <div className="space-y-2">
          {exports.map((exp) => (
            <div key={exp.key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {exp.key.replace("exports/", "")}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(exp.uploaded).toLocaleString()} - {formatBytes(exp.size)}
                </p>
              </div>
              <a
                href={`${basePath}/api/export?id=${exp.key.replace("exports/", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-3 px-2 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View
              </a>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
        Stored in Cloudflare R2 (MEDIA bucket)
      </p>
    </div>
  );
}
