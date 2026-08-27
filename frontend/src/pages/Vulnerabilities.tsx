import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../api/client";
import type { Vulnerability } from "../api/client";
import { EmptyState, ErrorBanner, Loading, SeverityBadge } from "../components/Status";

export default function Vulnerabilities() {
  const [vulns, setVulns] = useState<Vulnerability[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listVulnerabilities()
      .then(setVulns)
      .catch((e: ApiError) => setError(e.message));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Known vulnerabilities</h1>
        <p className="text-slate-500 mt-1 max-w-2xl">
          Click a CVE to see every project transitively exposed to it, and how many dependency hops away the
          exposure sits.
        </p>
      </div>

      {error && <ErrorBanner message={error} />}
      {!error && !vulns && <Loading label="Loading vulnerabilities..." />}
      {!error && vulns && vulns.length === 0 && <EmptyState title="No vulnerabilities recorded" />}
      {!error && vulns && vulns.length > 0 && (
        <div className="space-y-3">
          {vulns.map((v) => (
            <Link
              key={v.cve_id}
              to={`/blast-radius/${encodeURIComponent(v.cve_id)}`}
              className="block rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-red-500/30 hover:bg-white/[0.05] transition-colors"
            >
              <div className="flex items-center gap-3 flex-wrap">
                <SeverityBadge severity={v.severity} />
                <span className="font-mono text-sm text-slate-200">{v.cve_id}</span>
                <span className="text-xs text-slate-600">{v.published}</span>
              </div>
              <p className="text-sm text-slate-400 mt-2">{v.summary}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {v.affected_packages.map((p) => (
                  <span key={p} className="text-xs px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-500">
                    {p}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
