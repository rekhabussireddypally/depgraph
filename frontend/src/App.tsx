import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import PackageDetail from "./pages/PackageDetail";
import Vulnerabilities from "./pages/Vulnerabilities";
import BlastRadius from "./pages/BlastRadius";
import GraphInsights from "./pages/GraphInsights";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/packages/:name" element={<PackageDetail />} />
          <Route path="/vulnerabilities" element={<Vulnerabilities />} />
          <Route path="/blast-radius/:cveId" element={<BlastRadius />} />
          <Route path="/insights" element={<GraphInsights />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
