import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="text-center py-24">
      <p className="text-slate-600 font-mono text-sm">404</p>
      <h1 className="text-xl font-semibold text-slate-200 mt-2">Page not found</h1>
      <Link to="/" className="inline-block mt-4 text-sm text-indigo-300 hover:underline">
        &larr; Back to package search
      </Link>
    </div>
  );
}
