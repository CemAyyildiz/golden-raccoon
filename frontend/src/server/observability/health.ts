import { apiCacheStrategy } from "@/server/cache/strategy";
import { getAgentReadiness, getEnvHealth } from "@/server/env/validation";
import { getReleaseReadinessHealth } from "@/server/operations/releaseReadiness";
import { getPortfolioProviderHealth } from "@/server/portfolio/getPortfolio";
import { getStorageHealth, listAgentRunRecords } from "@/server/storage";
import { getApiTimingSampleCount, getRecentApiLatencyByRoute } from "@/server/observability/timing";

/**
 * Static reference to the documented performance budgets. Kept as metadata
 * (not a parsed import of docs/performance/budgets.json) so the health
 * payload never depends on files outside the frontend build root.
 */
function getPerformanceBudgetsReference() {
  return {
    docPath: "docs/PERFORMANCE_BUDGETS.md",
    dataPath: "docs/performance/budgets.json",
    checkedBy: "npm run test:perf",
    detail: "Web Vitals, bundle size, and API latency budgets are documented and enforced by the CI budget check.",
  };
}

function getLastSuccessfulProviderCall() {
  const records = listAgentRunRecords();
  const connectedSources = records
    .flatMap((record) => record.results)
    .flatMap((result) => result.sources.map((source) => ({ agent: result.agent, source })))
    .filter((item) => item.source.status === "connected" && item.source.checkedAt)
    .sort((left, right) => new Date(right.source.checkedAt ?? 0).getTime() - new Date(left.source.checkedAt ?? 0).getTime());

  return connectedSources[0]
    ? {
        agent: connectedSources[0].agent,
        provider: connectedSources[0].source.provider ?? connectedSources[0].source.label,
        checkedAt: connectedSources[0].source.checkedAt,
      }
    : undefined;
}

export function getProductionHealth() {
  return {
    envConfig: getEnvHealth(),
    agentReadiness: getAgentReadiness(),
    providerConnectivity: {
      portfolio: getPortfolioProviderHealth(),
    },
    databaseConnectivity: getStorageHealth(),
    cacheStatus: apiCacheStrategy,
    releaseReadiness: getReleaseReadinessHealth(),
    lastSuccessfulProviderCall: getLastSuccessfulProviderCall(),
  };
}

export function getPerformanceHealth() {
  return {
    budgets: getPerformanceBudgetsReference(),
    // Server = this Next.js process's own request handling time.
    // Provider = external data sources (see providerTimeoutBudgets in server/providers/adapter.ts).
    // Client = Web Vitals reported from the browser (frontend/src/lib/webVitals.ts); not aggregated server-side.
    recentApiLatencyMs: {
      scope: "server",
      note: "In-memory ring buffer of the last 200 requests per route. Latency numbers only — no wallet or payload data is retained.",
      byRoute: getRecentApiLatencyByRoute(),
      sampleSize: getApiTimingSampleCount(),
    },
    clientWebVitals: {
      scope: "client",
      note: "Reported per-session from the browser via frontend/src/components/WebVitalsReporter.tsx; not aggregated in this payload.",
    },
  };
}
