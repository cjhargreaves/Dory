from ..source_capture import capture_call_site
from ..pricing import get_cost
from ..reporter import Reporter


class TrackedModels:
    def __init__(self, models, agent: str, reporter: Reporter):
        self._models = models
        self._agent = agent
        self._reporter = reporter

    def generate_content(self, **kwargs):
        function_name = kwargs.pop("function_name", None)
        call_site = capture_call_site()
        response = self._models.generate_content(**kwargs)

        model = kwargs.get("model", "unknown")
        usage = response.usage_metadata
        input_tokens = usage.prompt_token_count or 0
        output_tokens = usage.candidates_token_count or 0

        event = {
            "agent": self._agent,
            "model": model,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "cost_usd": get_cost(model, input_tokens, output_tokens),
        }
        if not function_name and call_site:
            function_name = call_site["function"]
        if function_name:
            event["function_name"] = function_name
        if call_site:
            event["call_site"] = call_site

        self._reporter.send(event)
        return response

    def __getattr__(self, name):
        return getattr(self._models, name)


class DoryGeminiClient:
    def __init__(self, client, agent: str, reporter: Reporter):
        self._client = client
        self.models = TrackedModels(client.models, agent, reporter)

    def __getattr__(self, name):
        return getattr(self._client, name)
