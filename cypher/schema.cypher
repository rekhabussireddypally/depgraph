// DepGraph -- schema setup.
// Run once against a fresh CognoDB instance (seed/seed.py runs these
// automatically before loading data, so you normally don't need to run
// this file by hand -- it's here so the constraints are reviewable as
// plain Cypher, independent of the Python loader).

CREATE CONSTRAINT package_name    IF NOT EXISTS FOR (p:Package)     REQUIRE p.name     IS UNIQUE;
CREATE CONSTRAINT vuln_id         IF NOT EXISTS FOR (v:Vulnerability) REQUIRE v.cve_id  IS UNIQUE;
CREATE CONSTRAINT maintainer_user IF NOT EXISTS FOR (m:Maintainer)  REQUIRE m.username IS UNIQUE;
CREATE CONSTRAINT project_name    IF NOT EXISTS FOR (p:Project)     REQUIRE p.name     IS UNIQUE;
