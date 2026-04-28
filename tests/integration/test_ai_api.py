from app.main import app


def test_requirement_draft_endpoint_returns_structured_draft(client) -> None:
    def fake_service():
        class StubService:
            def generate_requirement_draft(self, payload):
                return {
                    "title": "Generated requirement",
                    "summary": "Generated summary",
                    "business_value": "Generated value",
                    "acceptance_criteria": "Generated acceptance criteria",
                    "status": "draft",
                }

            def generate_scenario_draft(self, payload):
                raise AssertionError("Not used in this test")

        return StubService()

    from app.api.routes.ai import get_ai_draft_service

    app.dependency_overrides[get_ai_draft_service] = fake_service
    response = client.post(
        "/api/ai/requirement-draft",
        json={"raw_input": "Need login"},
    )
    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["title"] == "Generated requirement"


def test_scenario_draft_endpoint_returns_scenarios(client) -> None:
    def fake_service():
        class StubService:
            def generate_requirement_draft(self, payload):
                raise AssertionError("Not used in this test")

            def generate_scenario_draft(self, payload):
                return {
                    "feature_name": "Generated feature",
                    "scenarios": [
                        {
                            "scenario_title": "Generated scenario",
                            "given_text": "Given",
                            "when_text": "When",
                            "then_text": "Then",
                            "coverage_frontend": True,
                            "coverage_backend": False,
                            "coverage_app": False,
                            "status": "draft",
                        }
                    ],
                }

        return StubService()

    from app.api.routes.ai import get_ai_draft_service

    app.dependency_overrides[get_ai_draft_service] = fake_service
    response = client.post(
        "/api/ai/scenario-draft",
        json={"title": "Login"},
    )
    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["feature_name"] == "Generated feature"


def test_task_breakdown_draft_endpoint_returns_tasks(client) -> None:
    def fake_service():
        class StubService:
            def generate_requirement_draft(self, payload):
                raise AssertionError("Not used in this test")

            def generate_scenario_draft(self, payload):
                raise AssertionError("Not used in this test")

            def generate_task_breakdown_draft(self, payload):
                return {
                    "tasks": [
                        {
                            "title": "Generated backend task",
                            "description": "Generated description",
                            "task_type": "backend",
                            "owner_name": "backend-dev",
                            "status": "todo",
                        }
                    ]
                }

        return StubService()

    from app.api.routes.ai import get_ai_draft_service

    app.dependency_overrides[get_ai_draft_service] = fake_service
    response = client.post(
        "/api/ai/task-breakdown-draft",
        json={"title": "Login"},
    )
    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["tasks"][0]["title"] == "Generated backend task"
