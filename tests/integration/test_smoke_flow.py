def test_traceflow_core_smoke_path(client) -> None:
    requirement_response = client.post(
        "/api/requirements",
        json={
            "title": "Passwordless login",
            "raw_input": "Users should log in with a one-time code",
            "summary": "Support passwordless login via OTP",
            "business_value": "Reduce login friction",
            "acceptance_criteria": "User can request and use a valid one-time code",
            "status": "draft",
        },
    )

    assert requirement_response.status_code == 201
    requirement = requirement_response.json()
    requirement_id = requirement["id"]

    scenario_response = client.post(
        f"/api/requirements/{requirement_id}/scenarios",
        json={
            "feature_name": "Passwordless authentication",
            "scenario_title": "User logs in with one-time code",
            "given_text": "User is on the login page",
            "when_text": "User enters a valid one-time code",
            "then_text": "System signs the user in",
            "coverage_frontend": True,
            "coverage_backend": True,
            "status": "draft",
        },
    )

    assert scenario_response.status_code == 201
    scenario = scenario_response.json()
    scenario_id = scenario["id"]

    task_response = client.post(
        f"/api/requirements/{requirement_id}/tasks",
        json={
            "title": "Implement OTP verification API",
            "description": "Add backend endpoint for validating one-time login codes",
            "task_type": "backend",
            "owner_name": "backend-dev",
            "status": "todo",
            "scenario_id": scenario_id,
        },
    )

    assert task_response.status_code == 201
    task = task_response.json()

    acceptance_response = client.post(
        f"/api/requirements/{requirement_id}/acceptance-runs",
        json={
            "status": "passed",
            "notes": "Smoke path verified end-to-end",
            "recorded_by": "qa-smoke",
        },
    )

    assert acceptance_response.status_code == 201
    acceptance_run = acceptance_response.json()
    assert acceptance_run["status"] == "passed"

    detail_response = client.get(f"/api/requirements/{requirement_id}/detail")

    assert detail_response.status_code == 200
    detail = detail_response.json()
    assert detail["requirement"]["title"] == "Passwordless login"
    assert len(detail["scenarios"]) == 1
    assert detail["scenarios"][0]["id"] == scenario_id
    assert len(detail["tasks"]) == 1
    assert detail["tasks"][0]["id"] == task["id"]
    assert len(detail["acceptance_runs"]) == 1
    assert detail["acceptance_runs"][0]["recorded_by"] == "qa-smoke"
