import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../api/client";
import type { PackageSummary } from "../api/client";
import { EcosystemBadge, EmptyState, ErrorBanner, Loading } from "../components/Status";

const SPOTLIGHT = ["react-scripts", "log4j-core", "event-stream", "requests", "lodash"];

export default function Home() {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<PackageSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const id = setTimeout(() => {
      api
        .searchPackages(term)
        .then(setResults)
        .catch((e: ApiError) => setError(e.message))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(id);
  }, [term]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Explore the dependency graph</h1>
        <p className="text-slate-500 mt-1 max-w-2xl">
          Search any package to see its dependencies, dependents, maintainers, and known vulnerabilities &mdash; and
          trace how a single compromised package can ripple through your projects.
        </p>
      </div>

      <div>
        <input
          autoFocus
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder='Search packages, e.g. "react", "log4j", "requests"...'
          className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
        />
        {!term && (
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-xs text-slate-600 mr-1 self-center">Try:</span>
            {SPOTLIGHT.map((s) => (
              <button
                key={s}
                onClick={() => setTerm(s)}
                className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <ErrorBanner message={error} />}
      {!error && loading && <Loading label="Searching packages..." />}
      {!error && !loading && results && results.length === 0 && (
        <EmptyState title="No packages found" hint="Try a different search term." />
      )}
      {!error && !loading && results && results.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {results.map((p) => (
            <Link
              key={p.name}
              to={`/packages/${encodeURIComponent(p.name)}`}
              className="group rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-indigo-500/40 hover:bg-white/[0.05] transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-slate-100 group-hover:text-indigo-300 truncate">{p.name}</span>
                <EcosystemBadge ecosystem={p.ecosystem} />
              </div>
              <p className="text-sm text-slate-500 mt-1.5 line-clamp-2">{p.description}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
