const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`);
  } catch {
    throw new ApiError("Cannot reach the API server. Is the backend running?", 0);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(body.detail ?? "Request failed", res.status);
  }
  return res.json();
}

export interface HealthStatus {
  database_connected: boolean;
  message: string | null;
}

export interface PackageSummary {
  name: string;
  ecosystem: string;
  description: string;
}

export interface PackageDetail extends PackageSummary {
  dependencies: { name: string; version_range: string }[];
  dependents: { name: string; version_range: string }[];
  maintainers: { name: string; username: string }[];
  vulnerabilities: { cve_id: string; severity: string; version_range: string }[];
}

export interface DependencyTree {
  root: string;
  paths: { chain: string[]; depth: number }[];
}

export interface Vulnerability {
  cve_id: string;
  severity: string;
  summary: string;
  published: string;
  affected_packages: string[];
}

export interface BlastRadiusResult {
  cve_id: string;
  exposed_projects: { project: string; owner: string; vulnerable_package: string; hops: number }[];
}

export interface ShortestPathResult {
  chain: string[];
  hops: number;
}

export interface CycleResult {
  chain: string[];
}

export interface BusFactorResult {
  maintainer: string;
  username: string;
  packages: string[];
  exposed_projects: number;
}

export const api = {
  health: () => request<HealthStatus>("/api/health"),
  searchPackages: (term: string) => request<PackageSummary[]>(`/api/packages/search?term=${encodeURIComponent(term)}`),
  getPackage: (name: string) => request<PackageDetail>(`/api/packages/${encodeURIComponent(name)}`),
  getDependencyTree: (name: string) => request<DependencyTree>(`/api/packages/${encodeURIComponent(name)}/tree`),
  listVulnerabilities: () => request<Vulnerability[]>("/api/vulnerabilities"),
  getBlastRadius: (cveId: string) => request<BlastRadiusResult>(`/api/blast-radius/${encodeURIComponent(cveId)}`),
  getShortestPath: (source: string, target: string) =>
    request<ShortestPathResult>(`/api/shortest-path?source=${encodeURIComponent(source)}&target=${encodeURIComponent(target)}`),
  getCycles: () => request<CycleResult[]>("/api/cycles"),
  getBusFactor: (maxPackages = 1) => request<BusFactorResult[]>(`/api/bus-factor?max_packages=${maxPackages}`),
};
