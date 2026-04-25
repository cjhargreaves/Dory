COST_PER_TOKEN = {
    "claude-opus-4-7":            (15.00 / 1_000_000, 75.00 / 1_000_000),
    "claude-sonnet-4-6":          ( 3.00 / 1_000_000, 15.00 / 1_000_000),
    "claude-haiku-4-5":           ( 0.80 / 1_000_000,  4.00 / 1_000_000),
    "claude-3-5-sonnet-20241022": ( 3.00 / 1_000_000, 15.00 / 1_000_000),
    "claude-3-5-haiku-20241022":  ( 0.80 / 1_000_000,  4.00 / 1_000_000),
    "claude-3-opus-20240229":     (15.00 / 1_000_000, 75.00 / 1_000_000),
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
