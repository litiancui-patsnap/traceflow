def _create_requirement(client) -> int:
    response = client.post(
        "/api/requirements",
        json={"title": "Req", "summary": "Req", "status": "draft"},
    )
    return response.json()["id"]


def _create_task(client, requirement_id: int) -> int:
    response = client.post(
        f"/api/requirements/{requirement_id}/tasks",
        json={"title": "Task", "task_type": "backend", "status": "todo"},
    )
    return response.json()["id"]


def test_create_and_list_requirement_github_links(client) -> None:
    requirement_id = _create_requirement(client)
    create_response = client.post(
        f"/api/requirements/{requirement_id}/github-links",
        json={
            "link_type": "issue",
            "url": "https://github.com/org/repo/issues/1",
            "label": "Issue 1",
        },
    )

    assert create_response.status_code == 201

    list_response = client.get(f"/api/requirements/{requirement_id}/github-links")
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1


def test_create_and_list_task_github_links(client) -> None:
    requirement_id = _create_requirement(client)
    task_id = _create_task(client, requirement_id)
    create_response = client.post(
        f"/api/tasks/{task_id}/github-links",
        json={
            "link_type": "pr",
            "url": "https://github.com/org/repo/pull/2",
            "label": "PR 2",
        },
    )

    assert create_response.status_code == 201

    list_response = client.get(f"/api/tasks/{task_id}/github-links")
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1


def test_invalid_github_link_returns_400(client) -> None:
    requirement_id = _create_requirement(client)
    response = client.post(
        f"/api/requirements/{requirement_id}/github-links",
        json={
            "link_type": "issue",
            "url": "https://example.com/1",
        },
    )

    assert response.status_code == 400
