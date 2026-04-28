def test_dashboard_summary_returns_empty_counts(client) -> None:
    response = client.get("/api/dashboard/summary")

    assert response.status_code == 200
    assert response.json() == {
        "counts": {
            "total_requirements": 0,
            "draft_requirements": 0,
            "ready_requirements": 0,
            "accepted_requirements": 0,
            "at_risk_requirements": 0,
            "missing_scenarios_requirements": 0,
            "missing_tasks_requirements": 0,
            "in_progress_requirements": 0,
            "ready_for_review_requirements": 0,
        },
        "rows": [],
        "attention_needed": [],
        "recommended_actions": [
            {
                "owner": "Business Owner",
                "summary": "Scenario coverage is present across current requirements; focus on refining acceptance intent where needed.",
            },
            {
                "owner": "Delivery Lead",
                "summary": "No at-risk requirements are currently flagged by the dashboard.",
            },
            {
                "owner": "QA / Release",
                "summary": "No requirements are accepted yet; keep validation focus on release-critical scope.",
            },
        ],
    }


def test_dashboard_summary_aggregates_requirement_health(client) -> None:
    requirement_response = client.post(
        "/api/requirements",
        json={
            "title": "Passwordless login",
            "summary": "Enable OTP login",
            "status": "ready",
        },
    )
    requirement_id = requirement_response.json()["id"]

    client.post(
        f"/api/requirements/{requirement_id}/scenarios",
        json={
            "feature_name": "Authentication",
            "scenario_title": "OTP login succeeds",
            "status": "draft",
        },
    )
    client.post(
        f"/api/requirements/{requirement_id}/tasks",
        json={
            "title": "Implement OTP endpoint",
            "task_type": "backend",
            "status": "todo",
        },
    )
    client.post(
        f"/api/requirements/{requirement_id}/acceptance-runs",
        json={
            "status": "passed",
            "notes": "Release candidate accepted",
            "recorded_by": "qa-lead",
        },
    )
    client.post(
        f"/api/requirements/{requirement_id}/test-summaries",
        json={
            "source": "playwright",
            "result": "passed",
            "summary": "Smoke suite passed",
        },
    )

    response = client.get("/api/dashboard/summary")

    assert response.status_code == 200
    body = response.json()
    assert body["counts"] == {
        "total_requirements": 1,
        "draft_requirements": 0,
        "ready_requirements": 1,
        "accepted_requirements": 1,
        "at_risk_requirements": 0,
        "missing_scenarios_requirements": 0,
        "missing_tasks_requirements": 0,
        "in_progress_requirements": 0,
        "ready_for_review_requirements": 0,
    }
    assert len(body["rows"]) == 1
    row = body["rows"][0]
    assert row["title"] == "Passwordless login"
    assert row["status"] == "ready"
    assert row["scenario_count"] == 1
    assert row["task_count"] == 1
    assert row["latest_acceptance_status"] == "passed"
    assert row["latest_test_summary_result"] == "passed"
    assert row["health"] == "Accepted"
    assert row["needs_attention"] is False
    assert body["attention_needed"] == []


def test_dashboard_summary_marks_missing_traceability_and_risk(client) -> None:
    draft_requirement = client.post(
        "/api/requirements",
        json={
            "title": "Undefined requirement",
            "summary": "Still missing decomposition",
            "status": "draft",
        },
    ).json()

    blocked_requirement = client.post(
        "/api/requirements",
        json={
            "title": "Blocked release item",
            "summary": "Implementation is blocked",
            "status": "in_progress",
        },
    ).json()

    client.post(
        f"/api/requirements/{blocked_requirement['id']}/acceptance-runs",
        json={
            "status": "blocked",
            "notes": "Blocked by dependency",
            "recorded_by": "qa-coordinator",
        },
    )

    response = client.get("/api/dashboard/summary")

    assert response.status_code == 200
    body = response.json()
    assert body["counts"] == {
        "total_requirements": 2,
        "draft_requirements": 1,
        "ready_requirements": 0,
        "accepted_requirements": 0,
        "at_risk_requirements": 1,
        "missing_scenarios_requirements": 2,
        "missing_tasks_requirements": 2,
        "in_progress_requirements": 0,
        "ready_for_review_requirements": 0,
    }

    rows_by_title = {row["title"]: row for row in body["rows"]}
    assert rows_by_title["Undefined requirement"]["latest_acceptance_status"] == "none"
    assert rows_by_title["Undefined requirement"]["latest_test_summary_result"] == "none"
    assert rows_by_title["Undefined requirement"]["health"] == "Needs Definition"
    assert rows_by_title["Undefined requirement"]["needs_attention"] is True
    assert rows_by_title["Blocked release item"]["latest_acceptance_status"] == "blocked"
    assert rows_by_title["Blocked release item"]["latest_test_summary_result"] == "none"
    assert rows_by_title["Blocked release item"]["health"] == "At Risk"
    assert rows_by_title["Undefined requirement"]["id"] == draft_requirement["id"]
    assert len(body["attention_needed"]) == 2
    assert body["attention_needed"][0]["title"] == "Blocked release item"
