from fastapi.testclient import TestClient

from app.main import app


def test_root_endpoint_returns_app_name() -> None:
    client = TestClient(app)

    response = client.get("/")

    assert response.status_code == 200
    assert response.json()["message"] == "Traceflow"


def test_health_endpoint_returns_basic_runtime_info() -> None:
    client = TestClient(app)

    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "environment": "development",
        "model": "gpt-5.4",
    }
