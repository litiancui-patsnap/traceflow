def _create_requirement(client) -> int:
    response = client.post(
        "/api/requirements",
        json={
            "title": "Acceptance parent",
            "summary": "Acceptance parent summary",
            "status": "draft",
        },
    )
    return response.json()["id"]


def test_create_and_list_acceptance_runs(client) -> None:
    requirement_id = _create_requirement(client)

    create_response = client.post(
        f"/api/requirements/{requirement_id}/acceptance-runs",
        json={
            "status": "passed",
            "notes": "Verified by tester",
            "recorded_by": "qa-user",
        },
    )

    assert create_response.status_code == 201
    created = create_response.json()
    assert created["status"] == "passed"

    list_response = client.get(f"/api/requirements/{requirement_id}/acceptance-runs")

    assert list_response.status_code == 200
    assert len(list_response.json()) == 1
    assert list_response.json()[0]["recorded_by"] == "qa-user"


def test_invalid_acceptance_status_returns_400(client) -> None:
    requirement_id = _create_requirement(client)

    response = client.post(
        f"/api/requirements/{requirement_id}/acceptance-runs",
        json={
            "status": "almost-pass",
        },
    )

    assert response.status_code == 400


def test_missing_requirement_for_acceptance_run_returns_404(client) -> None:
    response = client.get("/api/requirements/999/acceptance-runs")

    assert response.status_code == 404
