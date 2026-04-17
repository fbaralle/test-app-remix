import type { MetaFunction } from "@remix-run/node";
import CryptoDashboard from "~/components/CryptoDashboard";
import FavoritesSection from "~/components/FavoritesSection";
import PageViewsSection from "~/components/PageViewsSection";
import FeatureFlagsSection from "~/components/FeatureFlagsSection";
import ExportsSection from "~/components/ExportsSection";

export const meta: MetaFunction = () => {
  return [
    { title: "Webflow Cloud Test App" },
    { name: "description", content: "Test Remix application for validating Webflow Cloud hosting, builds, and deployments." },
  ];
};

export default function Index() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <header className="pt-10 pb-6 text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">
          Webflow Cloud Test App
        </p>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Crypto Dashboard
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Live market data from CoinGecko
        </p>
      </header>
      <main className="flex-1 px-4 pb-12">
        <FavoritesSection />
        <CryptoDashboard />
        <div className="w-full max-w-6xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <PageViewsSection compact />
          <FeatureFlagsSection compact />
          <ExportsSection compact />
        </div>
      </main>
      <footer className="border-t border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/60 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500 dark:text-gray-400">
          <p>Webflow Cloud Test App — for internal testing purposes only</p>
          <p>Remix + React Query + Tailwind CSS</p>
        </div>
      </footer>
    </div>
  );
}
