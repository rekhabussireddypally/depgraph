import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.db import verify_connectivity, DatabaseUnavailable
from app.routers import packages, graph

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("depgraph")

app = FastAPI(title="DepGraph API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(packages.router)
app.include_router(graph.router)


@app.exception_handler(DatabaseUnavailable)
def database_unavailable_handler(request: Request, exc: DatabaseUnavailable):
    logger.error("Database unavailable while handling %s: %s", request.url.path, exc)
    return JSONResponse(
        status_code=503,
        content={"detail": "The graph database is unreachable right now. Please try again shortly."},
    )


@app.get("/api/health")
def health():
    ok, message = verify_connectivity()
    return {"database_connected": ok, "message": message}


@app.on_event("startup")
def on_startup():
    ok, message = verify_connectivity()
    if ok:
        logger.info("Connected to CognoDB successfully.")
    else:
        logger.warning("Starting up without a database connection: %s", message)
