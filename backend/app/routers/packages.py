from fastapi import APIRouter, HTTPException, Query

from app import queries
from app.db import run_query

router = APIRouter(prefix="/api/packages", tags=["packages"])


@router.get("/search")
def search_packages(term: str = Query("", min_length=0)):
    if not term:
        rows = run_query(queries.SEARCH_PACKAGES, {"term": ""})
    else:
        rows = run_query(queries.SEARCH_PACKAGES, {"term": term})
    return rows


@router.get("/{name}")
def get_package(name: str):
    rows = run_query(queries.PACKAGE_DETAIL, {"name": name})
    if not rows or rows[0]["name"] is None:
        raise HTTPException(status_code=404, detail=f"Package '{name}' not found")
    row = rows[0]
    row["dependencies"] = [d for d in row["dependencies"] if d["name"] is not None]
    row["dependents"] = [d for d in row["dependents"] if d["name"] is not None]
    row["maintainers"] = [m for m in row["maintainers"] if m["name"] is not None]
    row["vulnerabilities"] = [v for v in row["vulnerabilities"] if v["cve_id"] is not None]
    return row


@router.get("/{name}/tree")
def get_dependency_tree(name: str):
    rows = run_query(queries.DEPENDENCY_TREE, {"name": name})
    return {"root": name, "paths": rows}
