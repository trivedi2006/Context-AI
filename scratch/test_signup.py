import urllib.request
import json

url = "http://127.0.0.1:8000/auth/signup"
data = {
    "name": "Test User",
    "email": "testuser_9999@example.com",
    "password": "Password123!"
}
req = urllib.request.Request(
    url,
    data=json.dumps(data).encode('utf-8'),
    headers={"Content-Type": "application/json"}
)

try:
    with urllib.request.urlopen(req) as response:
        print("Status Code:", response.status)
        print("Body:", response.read().decode())
except urllib.error.HTTPError as e:
    print("HTTPError Status Code:", e.code)
    print("HTTPError Response Body:", e.read().decode())
except Exception as e:
    print("Exception:", str(e))
