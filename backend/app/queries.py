"""
All Cypher used by the API lives here, in one place, fully parameterised.

Graph model
-----------
(:Package {name, ecosystem, description})
(:Vulnerability {cve_id, severity, summary, published})
(:Maintainer {name, username})
(:Project {name, description, owner})

(:Package)-[:DEPENDS_ON {version_range}]->(:Package)   -- transitive, self-referencing
(:Vulnerability)-[:AFFECTS {version_range}]->(:Package)
(:Maintainer)-[:MAINTAINS]->(:Package)
(:Project)-[:USES {version}]->(:Package)
"""

# ---------------------------------------------------------------------------
# Search / listing
# ---------------------------------------------------------------------------

SEARCH_PACKAGES = """
MATCH (p:Package)
WHERE toLower(p.name) CONTAINS toLower($term)
RETURN p.name AS name, p.ecosystem AS ecosystem, p.description AS description
ORDER BY p.name
LIMIT 20
"""

LIST_VULNERABILITIES = """
MATCH (v:Vulnerability)-[:AFFECTS]->(p:Package)
RETURN v.cve_id AS cve_id, v.severity AS severity, v.summary AS summary,
       v.published AS published, collect(DISTINCT p.name) AS affected_packages
ORDER BY v.published DESC
"""

# ---------------------------------------------------------------------------
# Package detail (1-hop neighbourhood)
# ---------------------------------------------------------------------------

PACKAGE_DETAIL = """
MATCH (p:Package {name: $name})
OPTIONAL MATCH (p)-[dep:DEPENDS_ON]->(child:Package)
OPTIONAL MATCH (parent:Package)-[rdep:DEPENDS_ON]->(p)
OPTIONAL MATCH (m:Maintainer)-[:MAINTAINS]->(p)
OPTIONAL MATCH (v:Vulnerability)-[a:AFFECTS]->(p)
RETURN p.name AS name, p.ecosystem AS ecosystem, p.description AS description,
       collect(DISTINCT {name: child.name, version_range: dep.version_range}) AS dependencies,
       collect(DISTINCT {name: parent.name, version_range: rdep.version_range}) AS dependents,
       collect(DISTINCT {name: m.name, username: m.username}) AS maintainers,
       collect(DISTINCT {cve_id: v.cve_id, severity: v.severity, version_range: a.version_range}) AS vulnerabilities
"""

# ---------------------------------------------------------------------------
# Multi-hop: full transitive dependency tree for a package.
# Variable-length traversal -- this is the kind of query a relational schema
# needs a recursive CTE (and a hard-coded max depth) to even approximate.
# ---------------------------------------------------------------------------

DEPENDENCY_TREE = """
MATCH path = (root:Package {name: $name})-[:DEPENDS_ON*1..6]->(dep:Package)
RETURN [n IN nodes(path) | n.name] AS chain, length(path) AS depth
ORDER BY depth
"""

# ---------------------------------------------------------------------------
# THE headline query: blast radius of a vulnerability.
# "If this package has a critical CVE, which projects are transitively
# exposed, and how many dependency hops away is the exposure?"
# Unbounded-depth traversal over a self-referencing edge -- exactly the case
# relational databases handle badly (recursive CTE, unknown max depth,
# quadratic joins) and graph databases handle natively.
# ---------------------------------------------------------------------------

BLAST_RADIUS = """
MATCH (v:Vulnerability {cve_id: $cve_id})-[:AFFECTS]->(vulnerable:Package)
MATCH (proj:Project)-[:USES]->(entry:Package)
MATCH path = (entry)-[:DEPENDS_ON*0..8]->(vulnerable)
WITH proj, vulnerable, path, min(length(path)) AS hops
RETURN DISTINCT proj.name AS project, proj.owner AS owner,
       vulnerable.name AS vulnerable_package, hops
ORDER BY hops ASC, project ASC
"""

# ---------------------------------------------------------------------------
# Shortest dependency path between two arbitrary packages.
# ---------------------------------------------------------------------------

SHORTEST_PATH = """
MATCH (a:Package {name: $source}), (b:Package {name: $target}),
      path = shortestPath((a)-[:DEPENDS_ON*..10]->(b))
RETURN [n IN nodes(path) | n.name] AS chain, length(path) AS hops
"""

# ---------------------------------------------------------------------------
# Circular dependency detection -- a package that transitively depends on
# itself. Cycle detection over unbounded paths is another case that is
# painful to express (and to execute) as recursive SQL.
# ---------------------------------------------------------------------------

FIND_CYCLES = """
MATCH path = (p:Package)-[:DEPENDS_ON*2..8]->(p)
RETURN DISTINCT [n IN nodes(path) | n.name] AS chain
LIMIT 25
"""

# ---------------------------------------------------------------------------
# Bus-factor risk: maintainers whose packages, once transitive dependents
# are counted, sit upstream of the most projects. A single-person
# maintainer here is a supply-chain single point of failure.
# ---------------------------------------------------------------------------

BUS_FACTOR_RISK = """
MATCH (m:Maintainer)-[:MAINTAINS]->(pkg:Package)
WITH m, pkg, count { (m)-[:MAINTAINS]->() } AS packages_maintained
WHERE packages_maintained <= $max_packages
MATCH (proj:Project)-[:USES]->(entry:Package)
MATCH (entry)-[:DEPENDS_ON*0..8]->(pkg)
RETURN m.name AS maintainer, m.username AS username,
       collect(DISTINCT pkg.name) AS packages,
       count(DISTINCT proj) AS exposed_projects
ORDER BY exposed_projects DESC
LIMIT 10
"""

# ---------------------------------------------------------------------------
# Whole-graph export for the visualisation view.
# ---------------------------------------------------------------------------

GRAPH_OVERVIEW = """
MATCH (a:Package)-[r:DEPENDS_ON]->(b:Package)
RETURN a.name AS source, b.name AS target
LIMIT 300
"""
