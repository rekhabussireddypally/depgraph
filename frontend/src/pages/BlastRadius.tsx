import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, ApiError } from "../api/client";
import type { BlastRadiusResult } from "../api/client";
import { EmptyState, ErrorBanner, Loading } from "../components/Status";

export default function BlastRadius() {
  const { cveId = "" } = useParams();
  const [result, setResult] = useState<BlastRadiusResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setResult(null);
    api
      .getBlastRadius(cveId)
      .then(setResult)
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, [cveId]);

  if (loading) return <Loading label={`Tracing blast radius of ${cveId}...`} />;
  if (error) return <ErrorBanner message={error} />;
  if (!result) return null;

  const grouped = [...result.exposed_projects].sort((a, b) => a.hops - b.hops);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-slate-600 font-mono uppercase tracking-wide">Blast radius</p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-100 font-mono">{cveId}</h1>
        <p className="text-slate-500 mt-1 max-w-2xl">
          Every project that transitively depends &mdash; directly or through a chain of other packages &mdash; on a
          package this CVE affects.
        </p>
      </div>

      {grouped.length === 0 ? (
        <EmptyState
          title="No projects are exposed"
          hint="No project in the graph transitively depends on a package affected by this CVE."
        />
      ) : (
        <div>
          <p className="text-sm text-slate-500 mb-4">
            <span className="text-red-300 font-medium">{grouped.length}</span> project{grouped.length !== 1 && "s"}{" "}
            exposed
          </p>
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.03] text-slate-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Project</th>
                  <th className="text-left px-4 py-2.5 font-medium">Owner</th>
                  <th className="text-left px-4 py-2.5 font-medium">Vulnerable package</th>
                  <th className="text-left px-4 py-2.5 font-medium">Distance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {grouped.map((r) => (
                  <tr key={r.project} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-2.5 text-slate-200 font-medium">{r.project}</td>
                    <td className="px-4 py-2.5 text-slate-500">{r.owner}</td>
                    <td className="px-4 py-2.5">
                      <Link to={`/packages/${encodeURIComponent(r.vulnerable_package)}`} className="text-indigo-300 hover:underline">
                        {r.vulnerable_package}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          r.hops === 0
                            ? "bg-red-500/15 text-red-300 border-red-500/30"
                            : "bg-white/5 text-slate-400 border-white/10"
                        }`}
                      >
                        {r.hops === 0 ? "direct use" : `${r.hops} hop${r.hops > 1 ? "s" : ""} away`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
