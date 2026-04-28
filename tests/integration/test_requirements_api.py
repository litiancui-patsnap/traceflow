def test_create_and_get_requirement(client) -> None:
    create_response = client.post(
        "/api/requirements",
        json={
            "title": "Registration",
            "raw_input": "Need a registration flow",
            "summary": "Create registration requirement",
            "business_value": "Grow user base",
            "acceptance_criteria": "User can register with phone",
            "status": "draft",
        },
    )

    assert create_response.status_code == 201
    created = create_response.json()
    assert created["title"] == "Registration"

    get_response = client.get(f"/api/requirements/{created['id']}")

    assert get_response.status_code == 200
    assert get_response.json()["id"] == created["id"]


def test_list_requirements_returns_created_items(client) -> None:
    client.post(
        "/api/requirements",
        json={
            "title": "Checkout",
            "summary": "Checkout summary",
            "status": "draft",
        },
    )

    response = client.get("/api/requirements")

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["title"] == "Checkout"


def test_update_requirement_returns_latest_state(client) -> None:
    create_response = client.post(
        "/api/requirements",
        json={
            "title": "Profile page",
            "summary": "Initial",
            "status": "draft",
        },
    )
    requirement_id = create_response.json()["id"]

    response = client.patch(
        f"/api/requirements/{requirement_id}",
        json={
            "summary": "Updated",
            "status": "ready",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["summary"] == "Updated"
    assert body["status"] == "ready"


def test_missing_requirement_returns_404(client) -> None:
    response = client.get("/api/requirements/999")

    assert response.status_code == 404
