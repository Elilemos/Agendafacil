import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./tests/setup.js"],
    coverage: {
      include: [
        "server.js",
        "appointmentRules.js",
        "appointmentAvailability.js",
        "auth.js",
        "logger.js",
        "metrics.js",
        "integrations/**/*.js",
        "repositories/**/*.js",
      ],
    },
  },
});
