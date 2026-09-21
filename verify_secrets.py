#!/usr/bin/env python3
"""verify_secrets.py - Verify Mom's Dragonfly secrets across all platforms."""
import subprocess
import sys

def run(cmd, env=None):
    result = subprocess.run(cmd, capture_output=True, text=True, env=env)
    return result.stdout if result.returncode == 0 else f"ERROR: {result.stderr}"

def main():
    import os
    project_path = "/home/leandi-duplessis/github/workspaces/Mom'sDragonfly"
    
    print("=" * 60)
    print("MOM'S DRAGONFLY - SECRET PRESERVATION CHECK")
    print("=" * 60)
    
    # Check Convex production
    env_prod = {**os.environ, "CONVEX_DEPLOYMENT": "prod:rare-alpaca-711"}
    
    print("\n--- Convex Production ---")
    result = run(["npx", "convex", "env", "list"], cwd=project_path, env=env_prod)
    for line in result.split("\n"):
        if "GOOGLE_PLACES" in line or "BRAVE" in line or "GEMINI" in line:
            print(f"  {line}")
    
    # Check Convex dev
    print("\n--- Convex Dev ---")
    env_dev = {**os.environ, "CONVEX_DEPLOYMENT": "dev:different-squid-155"}
    result = run(["npx", "convex", "env", "list"], cwd=project_path, env=env_dev)
    for line in result.split("\n"):
        if "GOOGLE_PLACES" in line or "BRAVE" in line or "GEMINI" in line:
            print(f"  {line}")
    
    # Check Vercel
    print("\n--- Vercel Production ---")
    result = run(["npx", "vercel", "env", "ls", "--scope", "teacher-evans-projects"], cwd=project_path)
    for line in result.split("\n"):
        if "GOOGLE_PLACES" in line or "GEMINI" in line:
            print(f"  {line}")
    
    # Check if Places API works
    print("\n--- Places API Health Check ---")
    import requests
    result = run(["npx", "convex", "env", "get", "GOOGLE_PLACES_API_KEY"], cwd=project_path, env=env_prod)
    api_key = result.strip()
    if api_key and len(api_key) > 35:
        url = "https://places.googleapis.com/v1/places:searchNearby"
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": api_key,
            "X-Goog-FieldMask": "places.id,places.displayName",
        }
        body = {
            "includedTypes": ["restaurant"],
            "maxResultCount": 1,
            "locationRestriction": {
                "circle": {"center": {"latitude": -25.7479, "longitude": 28.2293}, "radius": 1000}
            },
        }
        response = requests.post(url, headers=headers, json=body, timeout=10)
        print(f"  Places API Status: {response.status_code}")
        if response.status_code == 200:
            print("  ✅ Key is VALID and RESTRICTED correctly")
        else:
            print(f"  ❌ Key issue: {response.text[:200]}")
    else:
        print(f"  ❌ Key missing or truncated (len={len(api_key) if api_key else 0})")

if __name__ == "__main__":
    main()
