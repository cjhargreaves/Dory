import os
from pathlib import Path
from dotenv import load_dotenv
import anthropic
import dory

load_dotenv(Path(__file__).parent / "backend" / ".env")

API_URL = os.environ.get("DORY_API_URL", "https://dory-production.up.railway.app")
API_KEY = os.environ["DORY_API_KEY"]
ANTHROPIC_API_KEY = os.environ["ANTHROPIC_API_KEY"]

base_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


def make_client(agent: str):
    return dory.wrap(base_client, agent=agent, api_url=API_URL, api_key=API_KEY)


def summarize_document(text: str) -> str:
    client = make_client("document-pipeline")
    response = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=512,
        messages=[{"role": "user", "content": f"Summarize this in 2-3 sentences:\n\n{text}"}],
    )
    return response.content[0].text


def classify_support_ticket(ticket: str) -> str:
    client = make_client("support-bot")
    response = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=128,
        messages=[{"role": "user", "content": f"Classify this support ticket as one of: billing, technical, account, general.\n\nTicket: {ticket}\n\nRespond with just the category."}],
    )
    return response.content[0].text.strip()


def review_code(code: str) -> str:
    client = make_client("code-reviewer")
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": f"Review this code for bugs and issues:\n\n```\n{code}\n```"}],
    )
    return response.content[0].text


def extract_entities(text: str) -> str:
    client = make_client("data-extractor")
    response = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=256,
        messages=[{"role": "user", "content": f"Extract all people, companies, and dates from this text as JSON:\n\n{text}"}],
    )
    return response.content[0].text


if __name__ == "__main__":
    print("summarize_document...")
    print(summarize_document("The transformer architecture was introduced in the paper 'Attention is All You Need' by Vaswani et al. in 2017. It replaced recurrent neural networks with self-attention mechanisms, enabling parallelisation during training and significantly improving performance on NLP tasks. It became the foundation for BERT, GPT, and most modern large language models."))
    print()

    print("classify_support_ticket...")
    print(classify_support_ticket("I was charged twice for my subscription this month and need a refund for the duplicate charge."))
    print()

    print("review_code...")
    print(review_code("def get_user(id):\n    return db.execute(f'SELECT * FROM users WHERE id = {id}')"))
    print()

    print("extract_entities...")
    print(extract_entities("Elon Musk founded SpaceX in 2002 and acquired Twitter in October 2022. Sam Altman became CEO of OpenAI in 2019."))
