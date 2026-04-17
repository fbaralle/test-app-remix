import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

interface PageViewsData {
  totalViews: number;
  uniqueVisitors: number;
}

interface PageViewsResponse extends PageViewsData {
  error?: string;
}

interface TrackResponse {
  success: boolean;
  totalViews: number;
  isNewVisitor: boolean;
  visitorId: string;
}

const VISITOR_ID_KEY = "crypto_dashboard_visitor_id";
const basePath = import.meta.env.PUBLIC_API_MOUNT_PATH || "";

function getVisitorId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(VISITOR_ID_KEY);
}

function setVisitorId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(VISITOR_ID_KEY, id);
}

async function fetchPageViews(): Promise<PageViewsData> {
  const res = await fetch(`${basePath}/api/pageviews`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as PageViewsResponse;
  if (data.error) throw new Error(data.error);
  return { totalViews: data.totalViews, uniqueVisitors: data.uniqueVisitors };
}

async function trackPageView(visitorId: string | null): Promise<TrackResponse> {
  const res = await fetch(`${basePath}/api/pageviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ visitorId }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

interface Props {
  compact?: boolean;
}

export default function PageViewsSection({ compact }: Props) {
  const hasTracked = useRef(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["pageViews"],
    queryFn: fetchPageViews,
    staleTime: 30000,
    retry: false,
  });

  const trackMutation = useMutation({
    mutationFn: () => trackPageView(getVisitorId()),
    retry: false,
    onSuccess: (result) => {
      if (result.visitorId) {
        setVisitorId(result.visitorId);
      }
      refetch();
    },
  });

  useEffect(() => {
    if (!hasTracked.current) {
      hasTracked.current = true;
      trackMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 ${compact ? "p-3" : "p-6"}`}>
        <h3 className={`font-bold text-gray-900 dark:text-white flex items-center gap-2 ${compact ? "text-sm mb-2" : "text-lg mb-4"}`}>
          <span>Page Views</span>
        </h3>
        <div className="animate-pulse flex gap-3">
          <div className={`bg-gray-200 dark:bg-gray-700 rounded ${compact ? "h-10 flex-1" : "h-16 w-32"}`} />
          <div className={`bg-gray-200 dark:bg-gray-700 rounded ${compact ? "h-10 flex-1" : "h-16 w-32"}`} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-lg border border-red-200 dark:border-red-800 ${compact ? "p-3" : "p-6"}`}>
        <h3 className={`font-bold text-gray-900 dark:text-white flex items-center gap-2 ${compact ? "text-sm mb-1" : "text-lg mb-2"}`}>
          <span>Page Views</span>
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
          <span>Page Views</span>
          <span className="text-xs font-normal text-gray-400">(KV)</span>
        </h3>
        <div className="flex gap-2">
          <div className="text-center p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded flex-1">
            <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {data?.totalViews.toLocaleString() || 0}
            </p>
            <p className="text-xs text-gray-500">Views</p>
          </div>
          <div className="text-center p-2 bg-green-50 dark:bg-green-900/30 rounded flex-1">
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {data?.uniqueVisitors.toLocaleString() || 0}
            </p>
            <p className="text-xs text-gray-500">Unique</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span>Page Views</span>
      </h3>
      <div className="flex gap-6">
        <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex-1">
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
            {data?.totalViews.toLocaleString() || 0}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Views</p>
        </div>
        <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg flex-1">
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            {data?.uniqueVisitors.toLocaleString() || 0}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Unique Visitors</p>
        </div>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
        Stored in Cloudflare KV (SESSIONS namespace)
      </p>
    </div>
  );
}
