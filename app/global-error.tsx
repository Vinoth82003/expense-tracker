"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-background text-foreground font-sans">
          <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle size={40} />
          </div>
          <h2 className="text-3xl font-bold mb-4">Critical System Error</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-lg mb-8 text-lg">
            A critical error occurred. Please try reloading the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
          >
            <RefreshCw size={20} />
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
