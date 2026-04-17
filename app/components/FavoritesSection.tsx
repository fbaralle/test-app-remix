import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Favorite {
  id: number;
  user_id: string;
  coin_id: string;
  coin_name: string | null;
  coin_symbol: string | null;
  coin_image: string | null;
  created_at: number;
}

interface FavoritesResponse {
  favorites: Favorite[];
  error?: string;
}

async function fetchFavorites(): Promise<FavoritesResponse> {
  const res = await fetch("/api/favorites?user_id=public");
  if (!res.ok) {
    throw new Error("Failed to fetch favorites");
  }
  return res.json();
}

async function removeFavorite(coinId: string): Promise<void> {
  const res = await fetch(`/api/favorites?user_id=public&coin_id=${coinId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Failed to remove favorite");
  }
}

export function useFavorites() {
  const { data } = useQuery({
    queryKey: ["favorites"],
    queryFn: fetchFavorites,
    retry: false,
  });
  return { data: data?.favorites };
}

export default function FavoritesSection() {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["favorites"],
    queryFn: fetchFavorites,
    retry: false,
  });

  const removeMutation = useMutation({
    mutationFn: removeFavorite,
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  const favorites = data?.favorites ?? [];

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Your Favorites
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-48 h-24 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Your Favorites
        </h2>
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">
            Failed to load favorites. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Your Favorites
        </h2>
        <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No favorites yet. Click the star icon on any coin to add it to your favorites.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto mb-8">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Your Favorites
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {favorites.map((favorite) => (
          <div
            key={favorite.id}
            className="flex-shrink-0 relative p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow min-w-[180px]"
          >
            <button
              onClick={() => removeMutation.mutate(favorite.coin_id)}
              disabled={removeMutation.isPending}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              aria-label={`Remove ${favorite.coin_name || favorite.coin_id} from favorites`}
            >
              <svg
                className="w-5 h-5 text-yellow-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
            <div className="flex items-center gap-3 mb-2">
              {favorite.coin_image && (
                <img
                  src={favorite.coin_image}
                  alt={favorite.coin_name || favorite.coin_id}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              )}
              <div className="flex flex-col">
                <span className="font-medium text-gray-900 dark:text-white">
                  {favorite.coin_name || favorite.coin_id}
                </span>
                {favorite.coin_symbol && (
                  <span className="text-xs text-gray-400 uppercase">
                    {favorite.coin_symbol}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
