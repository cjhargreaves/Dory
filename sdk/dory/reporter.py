import json
import threading
import urllib.request
import urllib.error


class Reporter:
    def __init__(self, api_url: str, api_key: str):
        self.api_url = api_url.rstrip("/")
        self.api_key = api_key

    def send(self, event: dict):
        # fire and forget — never block the agent
        threading.Thread(target=self._post, args=(event,), daemon=True).start()

    def _post(self, event: dict):
        try:
            data = json.dumps(event).encode()
            req = urllib.request.Request(
                f"{self.api_url}/api/events",
                data=data,
                headers={
                    "Content-Type": "application/json",
                    "X-API-Key": self.api_key,
                },
            )
            urllib.request.urlopen(req, timeout=5)
        except Exception:
            pass
