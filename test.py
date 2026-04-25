import os
import time
import sys

# load from backend/.env
env_path = os.path.join(os.path.dirname(__file__), "backend", ".env")
with open(env_path) as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

import anthropic
sys.path.insert(0, "sdk")
import dory

ANTHROPIC_API_KEY = os.environ["ANTHROPIC_API_KEY"]
DORY_API_KEY = os.environ.get("DORY_API_KEY", ANTHROPIC_API_KEY)

client = dory.wrap(
    anthropic.Anthropic(api_key=ANTHROPIC_API_KEY),
    agent="test-agent",
    api_url="http://localhost:8000",
    api_key=DORY_API_KEY,
)

print("Making Anthropic call via Dory SDK...")
response = client.messages.create(
    model="claude-haiku-4-5-20251001",
    max_tokens=50,
    messages=[{"role": "user", "content": "Say hello in one sentence."}],
)

print(f"Response:       {response.content[0].text}")
print(f"Input tokens:   {response.usage.input_tokens}")
print(f"Output tokens:  {response.usage.output_tokens}")

time.sleep(1)
print("(check backend terminal for cost output)")
