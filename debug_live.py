import requests

def debug_live_api():
    base_url = "https://chatx-uxfq.onrender.com/api/chat"
    headers = {
        "Origin": "https://chat-hsc8qgfca-shivamsinghtomar78s-projects.vercel.app",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type, X-Requested-With, Authorization"
    }
    
    print(f"--- Diagnostic for {base_url} ---")
    
    # 1. Test GET (Health/Home)
    try:
        health_url = "https://chatx-uxfq.onrender.com/api/health"
        print(f"\nTesting GET /api/health...")
        r = requests.get(health_url, timeout=10)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.text}")
    except Exception as e:
        print(f"GET failed: {e}")

    # 2. Test OPTIONS (CORS Preflight)
    try:
        print(f"\nTesting OPTIONS /api/chat...")
        r = requests.options(base_url, headers=headers, timeout=10)
        print(f"Status: {r.status_code}")
        print("CORS Headers:")
        for k, v in r.headers.items():
            if "Access-Control" in k:
                print(f"  {k}: {v}")
    except Exception as e:
        print(f"OPTIONS failed: {e}")

    # 3. Test POST (Actual Chat)
    try:
        print(f"\nTesting POST /api/chat (empty message test)...")
        r = requests.post(base_url, json={"message": "test"}, headers=headers, timeout=10)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.text[:200]}")
    except Exception as e:
        print(f"POST failed: {e}")

if __name__ == "__main__":
    debug_live_api()
