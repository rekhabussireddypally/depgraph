import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, ApiError } from "../api/client";
import type { DependencyTree, PackageDetail as PackageDetailT } from "../api/client";
import { EcosystemBadge, EmptyState, ErrorBanner, Loading, SeverityBadge } from "../components/Status";

function Pill({ children, to }: { children: React.ReactNode; to: string }) {
  return (
    <Link
      to={to}
      className="inline-block text-sm px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:border-indigo-500/40 hover:text-indigo-300 transition-colors"
    >
      {children}
    </Link>
  );
}

export default function PackageDetailPage() {
  const { name = "" } = useParams();
  const [pkg, setPkg] = useState<PackageDetailT | null>(null);
  const [tree, setTree] = useState<DependencyTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setPkg(null);
    setTree(null);
    Promise.all([api.getPackage(name), api.getDependencyTree(name)])
      .then(([p, t]) => {
        setPkg(p);
        setTree(t);
      })
      .catch((e: ApiError) => setError(e.status === 404 ? `Package "${name}" was not found.` : e.message))
      .finally(() => setLoading(false));
  }, [name]);

  if (loading) return <Loading label={`Loading ${name}...`} />;
  if (error) return <ErrorBanner message={error} />;
  if (!pkg) return null;

  const maxDepth = tree?.paths.reduce((m, p) => Math.max(m, p.depth), 0) ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">{pkg.name}</h1>
          <EcosystemBadge ecosystem={pkg.ecosystem} />
        </div>
        <p className="text-slate-500 mt-1 max-w-2xl">{pkg.description}</p>
      </div>

      {pkg.vulnerabilities.length > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/[0.06] p-4">
          <p className="text-sm font-medium text-red-300 mb-2">
            {pkg.vulnerabilities.length} known {pkg.vulnerabilities.length === 1 ? "vulnerability" : "vulnerabilities"}
          </p>
          <div className="flex flex-wrap gap-2">
            {pkg.vulnerabilities.map((v) => (
              <Link
                key={v.cve_id}
                to={`/blast-radius/${encodeURIComponent(v.cve_id)}`}
                className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-red-500/40 transition-colors"
              >
                <SeverityBadge severity={v.severity} />
                <span className="text-slate-300">{v.cve_id}</span>
                <span className="text-slate-600">&rarr; view blast radius</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <section>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Direct dependencies ({pkg.dependencies.length})
          </h2>
          {pkg.dependencies.length === 0 ? (
            <EmptyState title="No dependencies" hint="This package is a leaf node in the graph." />
          ) : (
            <div className="flex flex-wrap gap-2">
              {pkg.dependencies.map((d) => (
                <Pill key={d.name} to={`/packages/${encodeURIComponent(d.name)}`}>
                  {d.name} <span className="text-slate-600">{d.version_range}</span>
                </Pill>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Direct dependents ({pkg.dependents.length})
          </h2>
          {pkg.dependents.length === 0 ? (
            <EmptyState title="No dependents" hint="No package in the graph depends on this directly." />
          ) : (
            <div className="flex flex-wrap gap-2">
              {pkg.dependents.map((d) => (
                <Pill key={d.name} to={`/packages/${encodeURIComponent(d.name)}`}>
                  {d.name}
                </Pill>
              ))}
            </div>
          )}
        </section>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Maintainers</h2>
        {pkg.maintainers.length === 0 ? (
          <EmptyState title="No maintainer data" />
        ) : (
          <div className="flex flex-wrap gap-2">
            {pkg.maintainers.map((m) => (
              <span key={m.username} className="text-sm px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">
                {m.name} <span className="text-slate-600">@{m.username}</span>
              </span>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Full transitive dependency tree</h2>
          {tree && tree.paths.length > 0 && <span className="text-xs text-slate-600">{tree.paths.length} paths, depth {maxDepth}</span>}
        </div>
        <p className="text-xs text-slate-600 mb-3">
          Every package reachable by following DEPENDS_ON edges outward, at any depth &mdash; a variable-length
          traversal query.
        </p>
        {!tree || tree.paths.length === 0 ? (
          <EmptyState title="No transitive dependencies" hint="This package has no downstream dependency chain." />
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] divide-y divide-white/5 max-h-96 overflow-y-auto scrollbar-thin">
            {tree.paths.map((p, i) => (
              <div key={i} className="px-4 py-2 flex items-center gap-2 text-sm font-mono overflow-x-auto">
                <span className="text-slate-700 shrink-0">{p.depth} hop{p.depth > 1 ? "s" : ""}</span>
                <span className="text-slate-700">&middot;</span>
                {p.chain.map((n, j) => (
                  <span key={j} className="flex items-center gap-2 shrink-0">
                    {j > 0 && <span className="text-slate-700">&rarr;</span>}
                    <Link to={`/packages/${encodeURIComponent(n)}`} className="text-slate-400 hover:text-indigo-300">
                      {n}
                    </Link>
                  </span>
                ))}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
