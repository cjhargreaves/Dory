from .client import DoryClient
from .reporter import Reporter


def wrap(client, *, agent: str, api_url: str, api_key: str):
    reporter = Reporter(api_url=api_url, api_key=api_key)
    module = type(client).__module__

    if module.startswith("openai"):
        from .openai import DoryOpenAIClient
        return DoryOpenAIClient(client=client, agent=agent, reporter=reporter)

    if module.startswith("google"):
        from .gemini import DoryGeminiClient
        return DoryGeminiClient(client=client, agent=agent, reporter=reporter)

    return DoryClient(client=client, agent=agent, reporter=reporter)
