import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface FeatureFlags {
  [key: string]: boolean;
}

interface FlagsResponse {
  flags: FeatureFlags;
  error?: string;
}

const basePath = (import.meta.env.BASE_URL || "").replace(/\/$/, "");

const FLAG_LABELS: Record<string, { label: string; description: string }> = {
  dark_mode: { label: "Dark Mode", description: "Enable dark color scheme" },
  show_favorites: { label: "Show Favorites", description: "Display the favorites section" },
  show_exports: { label: "Show Exports", description: "Display the exports section" },
  show_page_views: { label: "Show Page Views", description: "Display the page views counter" },
  experimental_features: { label: "Experimental", description: "Enable experimental features" },
};

async function fetchFlags(): Promise<FeatureFlags> {
  const res = await fetch(`${basePath}/api/flags`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as FlagsResponse;
  if (data.error) throw new Error(data.error);
  return data.flags;
}

async function toggleFlag(flag: string, value: boolean): Promise<void> {
  const res = await fetch(`${basePath}/api/flags`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ flag, value }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export function useFeatureFlags() {
  return useQuery({
    queryKey: ["featureFlags"],
    queryFn: fetchFlags,
    staleTime: 30000,
    retry: false,
  });
}

interface Props {
  compact?: boolean;
}

export default function FeatureFlagsSection({ compact }: Props) {
  const queryClient = useQueryClient();
  const { data: flags, isLoading, error } = useFeatureFlags();

  const toggleMutation = useMutation({
    mutationFn: ({ flag, value }: { flag: string; value: boolean }) =>
      toggleFlag(flag, value),
    retry: false,
    onMutate: async ({ flag, value }) => {
      await queryClient.cancelQueries({ queryKey: ["featureFlags"] });
      const previous = queryClient.getQueryData<FeatureFlags>(["featureFlags"]);
      queryClient.setQueryData<FeatureFlags>(["featureFlags"], (old) => ({
        ...old,
        [flag]: value,
      }));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["featureFlags"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["featureFlags"] });
    },
  });

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 ${compact ? "p-3" : "p-6"}`}>
        <h3 className={`font-bold text-gray-900 dark:text-white flex items-center gap-2 ${compact ? "text-sm mb-2" : "text-lg mb-4"}`}>
          <span>Flags</span>
        </h3>
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`bg-gray-200 dark:bg-gray-700 rounded ${compact ? "h-6" : "h-10"}`} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-lg border border-red-200 dark:border-red-800 ${compact ? "p-3" : "p-6"}`}>
        <h3 className={`font-bold text-gray-900 dark:text-white flex items-center gap-2 ${compact ? "text-sm mb-1" : "text-lg mb-2"}`}>
          <span>Flags</span>
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
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <span>Flags</span>
          <span className="text-xs font-normal text-gray-400">(KV)</span>
        </h3>
        <div className="space-y-1.5">
          {Object.entries(flags || {}).slice(0, 3).map(([key, value]) => {
            const config = FLAG_LABELS[key] || { label: key };
            return (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs text-gray-700 dark:text-gray-300">{config.label}</span>
                <button
                  onClick={() => toggleMutation.mutate({ flag: key, value: !value })}
                  disabled={toggleMutation.isPending}
                  className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
                    value ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    value ? "translate-x-4" : "translate-x-0.5"
                  }`} />
                </button>
              </div>
            );
          })}
          {Object.keys(flags || {}).length > 3 && (
            <p className="text-xs text-gray-400">+{Object.keys(flags || {}).length - 3} more</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span>Feature Flags</span>
      </h3>
      <div className="space-y-3">
        {Object.entries(flags || {}).map(([key, value]) => {
          const config = FLAG_LABELS[key] || { label: key, description: "" };
          return (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{config.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{config.description}</p>
              </div>
              <button
                onClick={() => toggleMutation.mutate({ flag: key, value: !value })}
                disabled={toggleMutation.isPending}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  value ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  value ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
        Stored in Cloudflare KV (FLAGS namespace)
      </p>
    </div>
  );
}
