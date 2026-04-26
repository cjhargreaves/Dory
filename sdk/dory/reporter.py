import json
import sys
import threading
import urllib.request
import urllib.error


class Reporter:
    def __init__(self, api_url: str, api_key: str):
        self.api_url = api_url.rstrip("/")
        self.api_key = api_key

    def send(self, event: dict):
        threading.Thread(target=self._post, args=(event,), daemon=False).start()

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
            with urllib.request.urlopen(req, timeout=5):
                return
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="ignore")
            print(
                f"[dory] failed to report spend event: HTTP {exc.code} {body or exc.reason}",
                file=sys.stderr,
            )
        except urllib.error.URLError as exc:
            print(
                f"[dory] failed to report spend event: {exc.reason}",
                file=sys.stderr,
            )
        except Exception as exc:
            print(
                f"[dory] failed to report spend event: {exc}",
                file=sys.stderr,
            )
