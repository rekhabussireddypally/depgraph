// DepGraph -- the application's Cypher queries, as plain, runnable statements.
//
// This file exists so the queries can be read and run directly (e.g. in the
// CognoDB / Neo4j Browser) without going through the API. The single source
// of truth the backend actually executes is backend/app/queries.py -- every
// statement below is copied from there verbatim, with example literals
// substituted in place of the driver's $parameters so you can paste and run
// each one as-is. See that file's module docstring for the full graph model.
//
// Graph model
// -----------
// (:Package {name, ecosystem, description})
// (:Vulnerability {cve_id, severity, summary, published})
// (:Maintainer {name, username})
// (:Project {name, description, owner})
//
// (:Package)-[:DEPENDS_ON {version_range}]->(:Package)   -- transitive, self-referencing
// (:Vulnerability)-[:AFFECTS {version_range}]->(:Package)
// (:Maintainer)-[:MAINTAINS]->(:Package)
// (:Project)-[:USES {version}]->(:Package)


// ---------------------------------------------------------------------------
// Search packages by name (case-insensitive substring match)
// ---------------------------------------------------------------------------
MATCH (p:Package)
WHERE toLower(p.name) CONTAINS toLower('react')
RETURN p.name AS name, p.ecosystem AS ecosystem, p.description AS description
ORDER BY p.name
LIMIT 20;


// ---------------------------------------------------------------------------
// All known vulnerabilities, most recent first
// ---------------------------------------------------------------------------
MATCH (v:Vulnerability)-[:AFFECTS]->(p:Package)
RETURN v.cve_id AS cve_id, v.severity AS severity, v.summary AS summary,
       v.published AS published, collect(DISTINCT p.name) AS affected_packages
ORDER BY v.published DESC;


// ---------------------------------------------------------------------------
// Package detail: 1-hop neighbourhood (dependencies, dependents, maintainers,
// vulnerabilities) in a single round trip
// ---------------------------------------------------------------------------
MATCH (p:Package {name: 'react-scripts'})
OPTIONAL MATCH (p)-[dep:DEPENDS_ON]->(child:Package)
OPTIONAL MATCH (parent:Package)-[rdep:DEPENDS_ON]->(p)
OPTIONAL MATCH (m:Maintainer)-[:MAINTAINS]->(p)
OPTIONAL MATCH (v:Vulnerability)-[a:AFFECTS]->(p)
RETURN p.name AS name, p.ecosystem AS ecosystem, p.description AS description,
       collect(DISTINCT {name: child.name, version_range: dep.version_range}) AS dependencies,
       collect(DISTINCT {name: parent.name, version_range: rdep.version_range}) AS dependents,
       collect(DISTINCT {name: m.name, username: m.username}) AS maintainers,
       collect(DISTINCT {cve_id: v.cve_id, severity: v.severity, version_range: a.version_range}) AS vulnerabilities;


// ---------------------------------------------------------------------------
// MULTI-HOP: full transitive dependency tree for a package.
// Variable-length traversal -- the kind of query a relational schema needs a
// recursive CTE (and a hard-coded max depth) to even approximate.
// ---------------------------------------------------------------------------
MATCH path = (root:Package {name: 'react-scripts'})-[:DEPENDS_ON*1..6]->(dep:Package)
RETURN [n IN nodes(path) | n.name] AS chain, length(path) AS depth
ORDER BY depth;


// ---------------------------------------------------------------------------
// THE headline query -- blast radius of a vulnerability.
// "If this package has a critical CVE, which projects are transitively
// exposed, and how many dependency hops away is the exposure?"
// Unbounded-depth traversal over a self-referencing edge, fanning out from
// every project's direct dependencies -- exactly the case relational
// databases handle badly (recursive CTE, unknown max depth, quadratic joins)
// and graph databases handle natively.
// ---------------------------------------------------------------------------
MATCH (v:Vulnerability {cve_id: 'CVE-2021-44228'})-[:AFFECTS]->(vulnerable:Package)
MATCH (proj:Project)-[:USES]->(entry:Package)
MATCH path = (entry)-[:DEPENDS_ON*0..8]->(vulnerable)
WITH proj, vulnerable, path, min(length(path)) AS hops
RETURN DISTINCT proj.name AS project, proj.owner AS owner,
       vulnerable.name AS vulnerable_package, hops
ORDER BY hops ASC, project ASC;


// ---------------------------------------------------------------------------
// Shortest dependency path between two arbitrary packages
// ---------------------------------------------------------------------------
MATCH (a:Package {name: 'react-scripts'}), (b:Package {name: 'minimist'}),
      path = shortestPath((a)-[:DEPENDS_ON*..10]->(b))
RETURN [n IN nodes(path) | n.name] AS chain, length(path) AS hops;


// ---------------------------------------------------------------------------
// Circular dependency detection -- a package that transitively depends on
// itself. Cycle detection over unbounded paths is another case that is
// painful to express (and to execute) as recursive SQL.
// ---------------------------------------------------------------------------
MATCH path = (p:Package)-[:DEPENDS_ON*2..8]->(p)
RETURN DISTINCT [n IN nodes(path) | n.name] AS chain
LIMIT 25;


// ---------------------------------------------------------------------------
// Bus-factor risk: maintainers whose packages, once transitive dependents
// are counted, sit upstream of the most projects. A single-person maintainer
// here is a supply-chain single point of failure.
// ---------------------------------------------------------------------------
MATCH (m:Maintainer)-[:MAINTAINS]->(pkg:Package)
WITH m, pkg, count { (m)-[:MAINTAINS]->() } AS packages_maintained
WHERE packages_maintained <= 1
MATCH (proj:Project)-[:USES]->(entry:Package)
MATCH (entry)-[:DEPENDS_ON*0..8]->(pkg)
RETURN m.name AS maintainer, m.username AS username,
       collect(DISTINCT pkg.name) AS packages,
       count(DISTINCT proj) AS exposed_projects
ORDER BY exposed_projects DESC
LIMIT 10;


// ---------------------------------------------------------------------------
// Whole-graph export for the visualisation view
// ---------------------------------------------------------------------------
MATCH (a:Package)-[r:DEPENDS_ON]->(b:Package)
RETURN a.name AS source, b.name AS target
LIMIT 300;
