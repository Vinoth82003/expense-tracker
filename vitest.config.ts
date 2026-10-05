import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      // `server-only` is a tripwire, not a real dependency: Next.js aliases it
      // to its own compiled copy and applies the package's `react-server`
      // export condition, which resolves to the no-op `empty.js` on the server.
      // Vitest does neither, so server-only files fail to import at all. Point
      // at the same no-op Next uses for server code — the throwing entry point
      // must stay reserved for real client bundles.
      "server-only": path.resolve(
        __dirname,
        "node_modules/next/dist/compiled/server-only/empty.js"
      ),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
