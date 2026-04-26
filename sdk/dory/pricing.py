COST_PER_TOKEN = {
    # Anthropic
    "claude-opus-4-7":            (15.00 / 1_000_000, 75.00 / 1_000_000),
    "claude-sonnet-4-6":          ( 3.00 / 1_000_000, 15.00 / 1_000_000),
    "claude-haiku-4-5":           ( 0.80 / 1_000_000,  4.00 / 1_000_000),
    "claude-3-5-sonnet-20241022": ( 3.00 / 1_000_000, 15.00 / 1_000_000),
    "claude-3-5-haiku-20241022":  ( 0.80 / 1_000_000,  4.00 / 1_000_000),
    "claude-3-opus-20240229":     (15.00 / 1_000_000, 75.00 / 1_000_000),
    # OpenAI
    "gpt-4o":                     ( 2.50 / 1_000_000, 10.00 / 1_000_000),
    "gpt-4o-mini":                ( 0.15 / 1_000_000,  0.60 / 1_000_000),
    "gpt-4-turbo":                (10.00 / 1_000_000, 30.00 / 1_000_000),
    "gpt-4":                      (30.00 / 1_000_000, 60.00 / 1_000_000),
    "gpt-3.5-turbo":              ( 0.50 / 1_000_000,  1.50 / 1_000_000),
    "o1":                         (15.00 / 1_000_000, 60.00 / 1_000_000),
    "o1-mini":                    ( 3.00 / 1_000_000, 12.00 / 1_000_000),
    "o3-mini":                    ( 1.10 / 1_000_000,  4.40 / 1_000_000),
    # Gemini
    "gemini-2.5-pro":             ( 1.25 / 1_000_000, 10.00 / 1_000_000),
    "gemini-2.5-flash":           ( 0.15 / 1_000_000,  0.60 / 1_000_000),
    "gemini-2.0-flash":           ( 0.10 / 1_000_000,  0.40 / 1_000_000),
    "gemini-1.5-pro":             ( 1.25 / 1_000_000,  5.00 / 1_000_000),
    "gemini-1.5-flash":           ( 0.075 / 1_000_000, 0.30 / 1_000_000),
}


def get_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    rates = COST_PER_TOKEN.get(model)
    if not rates:
        for key in COST_PER_TOKEN:
            if model.startswith(key):
                rates = COST_PER_TOKEN[key]
                break
    if not rates:
        return 0.0
    return round(rates[0] * input_tokens + rates[1] * output_tokens, 8)
