"""
Loads the seed dataset (data.py) into CognoDB over the Bolt protocol using
the official Neo4j Python driver. Every write below is a parameterised
Cypher statement (UNWIND $rows ...) -- no string-concatenated Cypher.

Usage:
    cd seed
    pip install -r requirements.txt
    python seed.py            # loads data
    python seed.py --wipe     # deletes all nodes/relationships first
"""
import argparse
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from neo4j import GraphDatabase

sys.path.insert(0, str(Path(__file__).parent))
from data import PACKAGES, DEPENDENCIES, VULNERABILITIES, MAINTAINERS, PROJECTS  # noqa: E402

# Reuse the backend's .env if present, otherwise fall back to this dir's .env
BACKEND_ENV = Path(__file__).parent.parent / "backend" / ".env"
LOCAL_ENV = Path(__file__).parent / ".env"
load_dotenv(BACKEND_ENV if BACKEND_ENV.exists() else LOCAL_ENV)

NEO4J_URI = os.environ["NEO4J_URI"]
NEO4J_USER = os.environ["NEO4J_USER"]
NEO4J_PASSWORD = os.environ["NEO4J_PASSWORD"]

CONSTRAINTS = [
    "CREATE CONSTRAINT package_name IF NOT EXISTS FOR (p:Package) REQUIRE p.name IS UNIQUE",
    "CREATE CONSTRAINT vuln_id IF NOT EXISTS FOR (v:Vulnerability) REQUIRE v.cve_id IS UNIQUE",
    "CREATE CONSTRAINT maintainer_username IF NOT EXISTS FOR (m:Maintainer) REQUIRE m.username IS UNIQUE",
    "CREATE CONSTRAINT project_name IF NOT EXISTS FOR (p:Project) REQUIRE p.name IS UNIQUE",
]

WIPE = "MATCH (n) DETACH DELETE n"

LOAD_PACKAGES = """
UNWIND $rows AS row
MERGE (p:Package {name: row.name})
SET p.ecosystem = row.ecosystem, p.description = row.description
"""

LOAD_DEPENDENCIES = """
UNWIND $rows AS row
MATCH (a:Package {name: row.from}), (b:Package {name: row.to})
MERGE (a)-[r:DEPENDS_ON]->(b)
SET r.version_range = row.version_range
"""

LOAD_VULNERABILITIES = """
UNWIND $rows AS row
MERGE (v:Vulnerability {cve_id: row.cve_id})
SET v.severity = row.severity, v.summary = row.summary, v.published = row.published
WITH v, row
MATCH (p:Package {name: row.package})
MERGE (v)-[a:AFFECTS]->(p)
SET a.version_range = row.version_range
"""

LOAD_MAINTAINERS = """
UNWIND $rows AS row
MERGE (m:Maintainer {username: row.username})
SET m.name = row.name
WITH m, row
UNWIND row.packages AS pkg_name
MATCH (p:Package {name: pkg_name})
MERGE (m)-[:MAINTAINS]->(p)
"""

LOAD_PROJECTS = """
UNWIND $rows AS row
MERGE (proj:Project {name: row.name})
SET proj.owner = row.owner, proj.description = row.description
WITH proj, row
UNWIND row.uses AS use
MATCH (p:Package {name: use.package})
MERGE (proj)-[u:USES]->(p)
SET u.version = use.version
"""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--wipe", action="store_true", help="Delete all existing nodes/relationships first")
    args = parser.parse_args()

    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    driver.verify_connectivity()
    print(f"Connected to {NEO4J_URI}")

    with driver.session() as session:
        if args.wipe:
            session.run(WIPE)
            print("Wiped existing graph.")

        for stmt in CONSTRAINTS:
            session.run(stmt)
        print("Constraints ensured.")

        package_rows = [{"name": n, "ecosystem": e, "description": d} for n, e, d in PACKAGES]
        session.run(LOAD_PACKAGES, rows=package_rows)
        print(f"Loaded {len(package_rows)} packages.")

        dep_rows = [{"from": a, "to": b, "version_range": vr} for a, b, vr in DEPENDENCIES]
        session.run(LOAD_DEPENDENCIES, rows=dep_rows)
        print(f"Loaded {len(dep_rows)} DEPENDS_ON edges.")

        vuln_rows = [
            {"cve_id": c, "severity": s, "summary": summ, "published": pub, "package": pkg, "version_range": vr}
            for c, s, summ, pub, pkg, vr in VULNERABILITIES
        ]
        session.run(LOAD_VULNERABILITIES, rows=vuln_rows)
        print(f"Loaded {len(vuln_rows)} vulnerabilities.")

        maintainer_rows = [{"name": n, "username": u, "packages": pkgs} for n, u, pkgs in MAINTAINERS]
        session.run(LOAD_MAINTAINERS, rows=maintainer_rows)
        print(f"Loaded {len(maintainer_rows)} maintainers.")

        project_rows = [
            {"name": n, "owner": o, "description": d, "uses": [{"package": pkg, "version": v} for pkg, v in uses]}
            for n, o, d, uses in PROJECTS
        ]
        session.run(LOAD_PROJECTS, rows=project_rows)
        print(f"Loaded {len(project_rows)} projects.")

    driver.close()
    print("Seed complete.")


if __name__ == "__main__":
    main()
