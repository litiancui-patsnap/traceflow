def _create_requirement(client) -> int:
    response = client.post(
        "/api/requirements",
        json={
            "title": "Aggregated requirement",
            "summary": "Requirement summary",
            "status": "draft",
        },
    )
    return response.json()["id"]


def test_requirement_detail_returns_all_linked_resources(client) -> None:
    requirement_id = _create_requirement(client)

    client.post(
        f"/api/requirements/{requirement_id}/scenarios",
        json={
            "feature_name": "Feature",
            "scenario_title": "Scenario",
            "status": "draft",
        },
    )
    client.post(
        f"/api/requirements/{requirement_id}/tasks",
        json={
            "title": "Task",
            "task_type": "backend",
            "status": "todo",
        },
    )
    client.post(
        f"/api/requirements/{requirement_id}/acceptance-runs",
        json={
            "status": "in_review",
            "recorded_by": "tester",
        },
    )
    client.post(
        f"/api/requirements/{requirement_id}/github-links",
        json={
            "link_type": "issue",
            "url": "https://github.com/org/repo/issues/123",
        },
    )
    client.post(
        f"/api/requirements/{requirement_id}/test-summaries",
        json={
            "source": "playwright",
            "result": "passed",
            "summary": "All good",
        },
    )

    response = client.get(f"/api/requirements/{requirement_id}/detail")

    assert response.status_code == 200
    body = response.json()
    assert body["requirement"]["id"] == requirement_id
    assert len(body["scenarios"]) == 1
    assert len(body["tasks"]) == 1
    assert len(body["acceptance_runs"]) == 1
    assert len(body["github_links"]) == 1
    assert len(body["test_summaries"]) == 1


def test_requirement_detail_returns_404_for_missing_requirement(client) -> None:
    response = client.get("/api/requirements/999/detail")

    assert response.status_code == 404
