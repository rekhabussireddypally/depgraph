import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../api/client";
import type { BusFactorResult, CycleResult, ShortestPathResult } from "../api/client";
import { EmptyState, ErrorBanner, Loading } from "../components/Status";

function Chain({ chain }: { chain: string[] }) {
  return (
    <div className="flex items-center gap-2 flex-wrap font-mono text-sm">
      {chain.map((n, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <span className="text-slate-700">&rarr;</span>}
          <Link to={`/packages/${encodeURIComponent(n)}`} className="text-slate-300 hover:text-indigo-300">
            {n}
          </Link>
        </span>
      ))}
    </div>
  );
}

function ShortestPathFinder() {
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [result, setResult] = useState<ShortestPathResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!source.trim() || !target.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSearched(true);
    api
      .getShortestPath(source.trim(), target.trim())
      .then(setResult)
      .catch((e: ApiError) => setError(e.status === 404 ? "No dependency path exists between these packages." : e.message))
      .finally(() => setLoading(false));
  };

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Shortest dependency path</h2>
      <p className="text-xs text-slate-600 mt-1 mb-4">
        Find the shortest chain of DEPENDS_ON edges between any two packages &mdash; a single query, no joins.
      </p>
      <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
        <input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="source, e.g. react-scripts"
          className="flex-1 min-w-[180px] rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
        <span className="text-slate-600 text-sm">&rarr;</span>
        <input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="target, e.g. minimist"
          className="flex-1 min-w-[180px] rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
        <button
          type="submit"
          disabled={!source.trim() || !target.trim()}
          className="px-3.5 py-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 text-sm font-medium hover:bg-indigo-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Find path
        </button>
      </form>

      <div className="mt-4">
        {loading && <Loading label="Searching..." />}
        {!loading && error && <ErrorBanner message={error} />}
        {!loading && !error && result && (
          <div className="rounded-lg bg-white/[0.03] border border-white/10 px-4 py-3">
            <p className="text-xs text-slate-600 mb-2">{result.hops} hop{result.hops !== 1 ? "s" : ""}</p>
            <Chain chain={result.chain} />
          </div>
        )}
        {!loading && !error && !result && searched === false && (
          <p className="text-sm text-slate-600">Enter two package names to trace the shortest path between them.</p>
        )}
      </div>
    </section>
  );
}

function CircularDependencies() {
  const [cycles, setCycles] = useState<CycleResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getCycles().then(setCycles).catch((e: ApiError) => setError(e.message));
  }, []);

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Circular dependencies</h2>
      <p className="text-xs text-slate-600 mt-1 mb-4">
        Packages that transitively depend on themselves &mdash; a path back to its own starting node.
      </p>
      {error && <ErrorBanner message={error} />}
      {!error && !cycles && <Loading label="Scanning for cycles..." />}
      {!error && cycles && cycles.length === 0 && (
        <EmptyState title="No cycles found" hint="The dependency graph is a clean DAG in this dataset." />
      )}
      {!error && cycles && cycles.length > 0 && (
        <div className="space-y-2">
          {cycles.map((c, i) => (
            <div key={i} className="rounded-lg bg-white/[0.03] border border-white/10 px-4 py-2.5">
              <Chain chain={c.chain} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function BusFactorRisk() {
  const [maxPackages, setMaxPackages] = useState(1);
  const [rows, setRows] = useState<BusFactorResult[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .getBusFactor(maxPackages)
      .then(setRows)
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, [maxPackages]);

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Bus-factor risk</h2>
          <p className="text-xs text-slate-600 mt-1">
            Maintainers of very few packages, ranked by how many projects transitively depend on their work &mdash; a
            single-person supply-chain point of failure.
          </p>
        </div>
        <label className="text-xs text-slate-500 flex items-center gap-2 shrink-0">
          Maintains &le;
          <select
            value={maxPackages}
            onChange={(e) => setMaxPackages(Number(e.target.value))}
            className="rounded-md bg-white/5 border border-white/10 px-2 py-1 text-slate-200"
          >
            {[1, 2, 3, 5, 10].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          packages
        </label>
      </div>

      <div className="mt-4">
        {error && <ErrorBanner message={error} />}
        {!error && loading && <Loading label="Computing exposure..." />}
        {!error && !loading && rows && rows.length === 0 && (
          <EmptyState title="No matching maintainers" hint="Try raising the package threshold." />
        )}
        {!error && !loading && rows && rows.length > 0 && (
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.03] text-slate-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Maintainer</th>
                  <th className="text-left px-4 py-2.5 font-medium">Packages</th>
                  <th className="text-left px-4 py-2.5 font-medium">Exposed projects</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((r) => (
                  <tr key={r.username} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-2.5 text-slate-200">
                      {r.maintainer} <span className="text-slate-600">@{r.username}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1.5">
                        {r.packages.map((p) => (
                          <Link
                            key={p}
                            to={`/packages/${encodeURIComponent(p)}`}
                            className="text-xs px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 hover:text-indigo-300 hover:border-indigo-500/40"
                          >
                            {p}
                          </Link>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-300 font-medium">{r.exposed_projects}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default function GraphInsights() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Graph insights</h1>
        <p className="text-slate-500 mt-1 max-w-2xl">
          Structural queries over the whole dependency graph &mdash; the kind of question that is natural in Cypher
          and awkward in SQL.
        </p>
      </div>
      <ShortestPathFinder />
      <CircularDependencies />
      <BusFactorRisk />
    </div>
  );
}
