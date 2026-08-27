import logging

from neo4j import GraphDatabase
from neo4j.exceptions import DriverError, ServiceUnavailable, AuthError

from app.config import settings

logger = logging.getLogger("depgraph.db")

_driver = None


def get_driver():
    global _driver
    if _driver is None:
        _driver = GraphDatabase.driver(
            settings.neo4j_uri,
            auth=(settings.neo4j_user, settings.neo4j_password),
        )
    return _driver


def verify_connectivity() -> tuple[bool, str | None]:
    """Used by the health check and app startup. Never raises."""
    try:
        get_driver().verify_connectivity()
        return True, None
    except AuthError:
        return False, "Authentication with the database failed. Check NEO4J_USER/NEO4J_PASSWORD."
    except ServiceUnavailable:
        return False, "The database is unreachable. Check NEO4J_URI and that the instance is running."
    except Exception as exc:  # noqa: BLE001 - surfaced to the health endpoint, not swallowed
        logger.exception("Unexpected error verifying database connectivity")
        return False, f"Unexpected database error: {exc}"


def run_query(cypher: str, parameters: dict | None = None) -> list[dict]:
    """Runs a single parameterised Cypher query and returns records as plain dicts.

    Raises DatabaseUnavailable on connection problems so route handlers can turn
    that into a clean 503 instead of a raw driver traceback.
    """
    try:
        driver = get_driver()
        with driver.session() as session:
            result = session.run(cypher, parameters or {})
            return [record.data() for record in result]
    except (ServiceUnavailable, AuthError, DriverError, OSError, ValueError) as exc:
        # DriverError/ServiceUnavailable/AuthError cover the documented connection
        # failures, but the driver's own DNS resolver raises a bare ValueError (and
        # low-level socket issues surface as OSError) before any of its exception
        # hierarchy applies -- catch those too so a bad/unreachable URI degrades to
        # a clean 503 instead of an unhandled 500.
        raise DatabaseUnavailable(str(exc)) from exc


class DatabaseUnavailable(Exception):
    pass
