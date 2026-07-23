import urllib.request
import json
import time
import uuid

url = "http://127.0.0.1:8000/auth/signup"
num_requests = 100
durations = []
failures = 0

print(f"Starting benchmark of {num_requests} signup requests against {url}...")

start_total = time.perf_counter()

for i in range(num_requests):
    unique_email = f"benchmark_user_{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "name": f"Bench User {i}",
        "email": unique_email,
        "password": "Password123!"
    }
    
    t0 = time.perf_counter()
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={"Content-Type": "application/json"}
    )
    
    try:
        with urllib.request.urlopen(req) as resp:
            elapsed = (time.perf_counter() - t0) * 1000
            durations.append(elapsed)
            if resp.status != 200:
                failures += 1
    except Exception as e:
        elapsed = (time.perf_counter() - t0) * 1000
        durations.append(elapsed)
        failures += 1
        print(f"Request {i} failed: {e}")

total_elapsed = time.perf_counter() - start_total
avg_duration = sum(durations) / len(durations) if durations else 0
max_duration = max(durations) if durations else 0
min_duration = min(durations) if durations else 0

print("\n================ BENCHMARK RESULTS ================")
print(f"Total Requests:      {num_requests}")
print(f"Successful Signups:  {num_requests - failures}")
print(f"Failed Signups:      {failures}")
print(f"Total Time:          {total_elapsed:.2f}s")
print(f"Average Response:    {avg_duration:.2f}ms")
print(f"Min Response:        {min_duration:.2f}ms")
print(f"Max Response:        {max_duration:.2f}ms")
print("====================================================")
