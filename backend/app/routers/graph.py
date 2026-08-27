from fastapi import APIRouter, HTTPException, Query

from app import queries
from app.db import run_query

router = APIRouter(prefix="/api", tags=["graph"])


@router.get("/vulnerabilities")
def list_vulnerabilities():
    return run_query(queries.LIST_VULNERABILITIES)


@router.get("/blast-radius/{cve_id}")
def blast_radius(cve_id: str):
    rows = run_query(queries.BLAST_RADIUS, {"cve_id": cve_id})
    return {"cve_id": cve_id, "exposed_projects": rows}


@router.get("/shortest-path")
def shortest_path(source: str = Query(...), target: str = Query(...)):
    rows = run_query(queries.SHORTEST_PATH, {"source": source, "target": target})
    if not rows:
        raise HTTPException(status_code=404, detail="No dependency path exists between these packages")
    return rows[0]


@router.get("/cycles")
def find_cycles():
    return run_query(queries.FIND_CYCLES)


@router.get("/bus-factor")
def bus_factor(max_packages: int = Query(1, ge=1, le=10)):
    return run_query(queries.BUS_FACTOR_RISK, {"max_packages": max_packages})


@router.get("/graph/overview")
def graph_overview():
    return run_query(queries.GRAPH_OVERVIEW)
