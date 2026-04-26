from ..source_capture import capture_call_site
from ..pricing import get_cost
from ..reporter import Reporter


class TrackedCompletions:
    def __init__(self, completions, agent: str, reporter: Reporter):
        self._completions = completions
        self._agent = agent
        self._reporter = reporter

    def create(self, **kwargs):
        function_name = kwargs.pop("function_name", None)
        call_site = capture_call_site()
        response = self._completions.create(**kwargs)

        model = kwargs.get("model", "unknown")
        input_tokens = response.usage.prompt_tokens
        output_tokens = response.usage.completion_tokens

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


class TrackedChat:
    def __init__(self, chat, agent: str, reporter: Reporter):
        self.completions = TrackedCompletions(chat.completions, agent, reporter)

    def __getattr__(self, name):
        return getattr(self._chat, name)


class DoryOpenAIClient:
    def __init__(self, client, agent: str, reporter: Reporter):
        self._client = client
        self.chat = TrackedChat(client.chat, agent, reporter)

    def __getattr__(self, name):
        return getattr(self._client, name)
