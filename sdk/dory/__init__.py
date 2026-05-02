from .client import KeelClient
from .reporter import Reporter


def wrap(client, *, agent: str, api_url: str, api_key: str):
    reporter = Reporter(api_url=api_url, api_key=api_key)
    module = type(client).__module__

    if module.startswith("openai"):
        from .openai import KeelOpenAIClient
        return KeelOpenAIClient(client=client, agent=agent, reporter=reporter)

    if module.startswith("google"):
        from .gemini import KeelGeminiClient
        return KeelGeminiClient(client=client, agent=agent, reporter=reporter)

    return KeelClient(client=client, agent=agent, reporter=reporter)
