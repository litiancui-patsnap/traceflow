def _create_requirement(client) -> int:
    response = client.post(
        "/api/requirements",
        json={
            "title": "Scenario parent",
            "summary": "Scenario parent summary",
            "status": "draft",
        },
    )
    return response.json()["id"]


def test_create_and_get_scenario(client) -> None:
    requirement_id = _create_requirement(client)

    create_response = client.post(
        f"/api/requirements/{requirement_id}/scenarios",
        json={
            "feature_name": "Login feature",
            "scenario_title": "User logs in",
            "given_text": "User is on login page",
            "when_text": "User submits valid credentials",
            "then_text": "System redirects to dashboard",
            "coverage_frontend": True,
            "coverage_backend": True,
            "status": "draft",
        },
    )

    assert create_response.status_code == 201
    scenario = create_response.json()

    get_response = client.get(f"/api/scenarios/{scenario['id']}")

    assert get_response.status_code == 200
    assert get_response.json()["scenario_title"] == "User logs in"


def test_list_scenarios_for_requirement(client) -> None:
    requirement_id = _create_requirement(client)
    client.post(
        f"/api/requirements/{requirement_id}/scenarios",
        json={
            "feature_name": "Checkout feature",
            "scenario_title": "Checkout succeeds",
            "status": "draft",
        },
    )

    response = client.get(f"/api/requirements/{requirement_id}/scenarios")

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["feature_name"] == "Checkout feature"


def test_update_scenario(client) -> None:
    requirement_id = _create_requirement(client)
    create_response = client.post(
        f"/api/requirements/{requirement_id}/scenarios",
        json={
            "feature_name": "Payment feature",
            "scenario_title": "Initial title",
            "status": "draft",
        },
    )
    scenario_id = create_response.json()["id"]

    response = client.patch(
        f"/api/scenarios/{scenario_id}",
        json={
            "scenario_title": "Updated title",
            "coverage_app": True,
            "status": "ready",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["scenario_title"] == "Updated title"
    assert body["coverage_app"] is True
    assert body["status"] == "ready"


def test_delete_scenario(client) -> None:
    requirement_id = _create_requirement(client)
    create_response = client.post(
        f"/api/requirements/{requirement_id}/scenarios",
        json={
            "feature_name": "Profile feature",
            "scenario_title": "Delete me",
            "status": "draft",
        },
    )
    scenario_id = create_response.json()["id"]

    delete_response = client.delete(f"/api/scenarios/{scenario_id}")
    assert delete_response.status_code == 204

    get_response = client.get(f"/api/scenarios/{scenario_id}")
    assert get_response.status_code == 404
