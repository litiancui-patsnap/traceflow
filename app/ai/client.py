import json
from abc import ABC, abstractmethod
from typing import Any

from openai import DefaultHttpxClient, OpenAI

from app.core.config import get_settings


class LLMClient(ABC):
    @abstractmethod
    def generate_json(self, *, system_prompt: str, user_prompt: str) -> dict[str, Any]:
        raise NotImplementedError


class OpenAICompatibleLLMClient(LLMClient):
    def __init__(self) -> None:
        settings = get_settings()
        self.model = settings.openai_model
        self.client = OpenAI(
            api_key=settings.openai_api_key or "placeholder",
            base_url=settings.openai_base_url,
            http_client=DefaultHttpxClient(trust_env=settings.openai_trust_env),
        )

    def generate_json(self, *, system_prompt: str, user_prompt: str) -> dict[str, Any]:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content or "{}"
        return _parse_json_object(content)


def _parse_json_object(content: str) -> dict[str, Any]:
    text = content.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if len(lines) >= 3:
            text = "\n".join(lines[1:-1]).strip()

    parsed = json.loads(text)
    if not isinstance(parsed, dict):
        raise ValueError("Expected top-level JSON object from LLM")
    return parsed


def get_llm_client() -> LLMClient:
    return OpenAICompatibleLLMClient()
