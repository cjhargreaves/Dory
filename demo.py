import os
import anthropic
import dory

API_URL = os.environ["DORY_API_URL"]
API_KEY = os.environ["DORY_API_KEY"]
ANTHROPIC_API_KEY = os.environ["ANTHROPIC_API_KEY"]

CALLS = [
    {
        "agent": "document-pipeline",
        "model": "claude-opus-4-7",
        "prompt": "Analyze this contract excerpt and extract key clauses, obligations, and dates: 'This Service Agreement is entered into as of January 1, 2026, between Acme Corp and Widget Inc. Acme Corp agrees to provide software development services for a fee of $150,000 payable in quarterly installments. Widget Inc shall provide all necessary access and documentation within 14 days of signing. Either party may terminate with 30 days written notice.'",
    },
    {
        "agent": "document-pipeline",
        "model": "claude-opus-4-7",
        "prompt": "Summarize this research abstract and identify key findings: 'This paper presents a novel approach to transformer-based language models using sparse attention mechanisms. We demonstrate a 40% reduction in computational cost while maintaining 97% of benchmark performance across GLUE tasks. Our method uses dynamic token pruning based on attention entropy scores computed at each layer.'",
    },
      {
        "agent": "support-bot",
        "model": "claude-sonnet-4-6",
        "prompt": "Customer says: 'I've been trying to reset my password for the last hour and keep getting an error that says my email is not recognized, but I definitely have an account.' Respond helpfully and concisely.",
    },
    {
        "agent": "support-bot",
        "model": "claude-sonnet-4-6",
        "prompt": "Customer asks: 'Can I use your product on multiple devices at the same time? I have a laptop, a desktop, and an iPad.' Give a clear, helpful answer.",
    },
    {
        "agent": "support-bot",
        "model": "claude-sonnet-4-6",
        "prompt": "Customer says: 'Your billing page is confusing. I was charged $49 but I thought I was on the $29 plan.' Respond helpfully.",
    },
    {
        "agent": "data-extractor",
        "model": "claude-haiku-4-5",
        "prompt": "Extract all named entities (people, organizations, locations, dates) from this text as JSON: 'On March 15, 2026, Sarah Johnson from Google met with representatives from OpenAI and Anthropic in San Francisco to discuss AI safety standards. Also attended by Dr. James Liu from MIT.'",
    },
    {
        "agent": "data-extractor",
        "model": "claude-haiku-4-5",
        "prompt": "Parse this CSV row into structured JSON with proper types: 'TXN-20260415,2026-04-15T14:32:00Z,customer_id:C-8821,product:Pro Plan,amount:149.00,currency:USD,status:completed,payment_method:visa_ending_4242'",
    },
    {
        "agent": "code-reviewer",
        "model": "claude-sonnet-4-6",
        "prompt": "Review this Python for bugs and security issues:\n\ndef get_user(user_id):\n    query = f\"SELECT * FROM users WHERE id = {user_id}\"\n    result = db.execute(query)\n    return result[0] if result else None\n\ndef process_file(path):\n    f = open(path)\n    return json.loads(f.read())",
    },

]

base_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

for call in CALLS:
    client = dory.wrap(base_client, agent=call["agent"], api_url=API_URL, api_key=API_KEY)
    print(f"→ {call['agent']} / {call['model']}...", end=" ", flush=True)
    response = client.messages.create(
        model=call["model"],
        max_tokens=1024,
        messages=[{"role": "user", "content": call["prompt"]}],
    )
    print(f"✓ {response.usage.input_tokens}in / {response.usage.output_tokens}out")