def _create_requirement(client) -> int:
    response = client.post(
        "/api/requirements",
        json={"title": "Req", "summary": "Req", "status": "draft"},
    )
    return response.json()["id"]


def test_create_and_list_test_summaries(client) -> None:
    requirement_id = _create_requirement(client)
    create_response = client.post(
        f"/api/requirements/{requirement_id}/test-summaries",
        json={
            "source": "playwright",
            "result": "passed",
            "summary": "Smoke passed",
            "report_url": "https://example.com/report",
        },
    )

    assert create_response.status_code == 201

    list_response = client.get(f"/api/requirements/{requirement_id}/test-summaries")
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1


def test_invalid_test_summary_returns_400(client) -> None:
    requirement_id = _create_requirement(client)
    response = client.post(
        f"/api/requirements/{requirement_id}/test-summaries",
        json={"source": "playwright", "result": "mystery"},
    )

    assert response.status_code == 400
