def _create_requirement(client) -> int:
    response = client.post(
        "/api/requirements",
        json={
            "title": "Task parent",
            "summary": "Task parent summary",
            "status": "draft",
        },
    )
    return response.json()["id"]


def _create_scenario(client, requirement_id: int) -> int:
    response = client.post(
        f"/api/requirements/{requirement_id}/scenarios",
        json={
            "feature_name": "Shared feature",
            "scenario_title": "Shared scenario",
            "status": "draft",
        },
    )
    return response.json()["id"]


def test_create_and_get_task(client) -> None:
    requirement_id = _create_requirement(client)
    scenario_id = _create_scenario(client, requirement_id)

    create_response = client.post(
        f"/api/requirements/{requirement_id}/tasks",
        json={
            "title": "Implement backend login",
            "description": "Add login endpoint",
            "task_type": "backend",
            "owner_name": "alice",
            "status": "todo",
            "scenario_id": scenario_id,
        },
    )

    assert create_response.status_code == 201
    task = create_response.json()

    get_response = client.get(f"/api/tasks/{task['id']}")

    assert get_response.status_code == 200
    assert get_response.json()["title"] == "Implement backend login"


def test_list_tasks_for_requirement(client) -> None:
    requirement_id = _create_requirement(client)
    client.post(
        f"/api/requirements/{requirement_id}/tasks",
        json={
            "title": "Build UI form",
            "task_type": "frontend",
            "status": "todo",
        },
    )

    response = client.get(f"/api/requirements/{requirement_id}/tasks")

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["task_type"] == "frontend"


def test_update_task(client) -> None:
    requirement_id = _create_requirement(client)
    create_response = client.post(
        f"/api/requirements/{requirement_id}/tasks",
        json={
            "title": "Initial task",
            "task_type": "app",
            "status": "todo",
        },
    )
    task_id = create_response.json()["id"]

    response = client.patch(
        f"/api/tasks/{task_id}",
        json={
            "owner_name": "mobile-dev",
            "status": "in_progress",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["owner_name"] == "mobile-dev"
    assert body["status"] == "in_progress"


def test_delete_task(client) -> None:
    requirement_id = _create_requirement(client)
    create_response = client.post(
        f"/api/requirements/{requirement_id}/tasks",
        json={
            "title": "Delete task",
            "task_type": "test",
            "status": "todo",
        },
    )
    task_id = create_response.json()["id"]

    delete_response = client.delete(f"/api/tasks/{task_id}")
    assert delete_response.status_code == 204

    get_response = client.get(f"/api/tasks/{task_id}")
    assert get_response.status_code == 404


def test_create_task_rejects_foreign_scenario(client) -> None:
    requirement_a = _create_requirement(client)
    requirement_b = _create_requirement(client)
    scenario_id = _create_scenario(client, requirement_a)

    response = client.post(
        f"/api/requirements/{requirement_b}/tasks",
        json={
            "title": "Wrong scenario link",
            "task_type": "backend",
            "status": "todo",
            "scenario_id": scenario_id,
        },
    )

    assert response.status_code == 400
