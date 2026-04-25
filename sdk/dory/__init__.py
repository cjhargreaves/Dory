from .client import DoryClient
from .reporter import Reporter


def wrap(client, *, agent: str, api_url: str, api_key: str) -> DoryClient:
    reporter = Reporter(api_url=api_url, api_key=api_key)
    return DoryClient(client=client, agent=agent, reporter=reporter)
