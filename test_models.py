"""
Model Benchmark Script
======================
Test all models and measure response times to determine optimal timeouts.
"""

import os
import sys
import time
import json
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from multi_model_provider import MultiModelProvider, DEFAULT_MODELS


def run_benchmark(iterations: int = 3) -> dict:
    """
    Run benchmark tests on all models.
    
    Args:
        iterations: Number of test iterations per model
        
    Returns:
        Dictionary with benchmark results
    """
    print("\n" + "=" * 70)
    print("MULTI-MODEL BENCHMARK TEST")
    print("=" * 70)
    print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Iterations per model: {iterations}")
    print("=" * 70)
    
    provider = MultiModelProvider()
    
    # Test prompts of varying complexity
    test_prompts = [
        {"role": "user", "content": "Say 'Hello' in one word."},
        {"role": "user", "content": "What is 2+2? Answer briefly."},
        {"role": "user", "content": "Explain what Python is in one sentence."},
    ]
    
    results = {}
    
    for model in provider.models:
        model_name = model.name
        results[model_name] = {
            "provider": model.provider,
            "model_id": model.model_id,
            "configured_timeout": model.timeout,
            "enabled": model.enabled,
            "response_times": [],
            "success_count": 0,
            "failure_count": 0,
            "errors": []
        }
        
        if not model.enabled:
            print(f"\n⏭️  {model_name}: SKIPPED (disabled)")
            continue
        
        print(f"\n🔄 Testing: {model_name}")
        print(f"   Provider: {model.provider}")
        print(f"   Model ID: {model.model_id}")
        print(f"   Timeout: {model.timeout}s")
        print("-" * 50)
        
        for i in range(iterations):
            prompt = test_prompts[i % len(test_prompts)]
            print(f"   Iteration {i+1}/{iterations}...", end=" ", flush=True)
            
            start_time = time.time()
            try:
                response = provider._call_model(model, [prompt])
                elapsed = time.time() - start_time
                
                if response:
                    results[model_name]["response_times"].append(elapsed)
                    results[model_name]["success_count"] += 1
                    print(f"✓ {elapsed:.2f}s")
                else:
                    results[model_name]["failure_count"] += 1
                    results[model_name]["errors"].append(f"Iteration {i+1}: No response")
                    print(f"✗ No response")
                    
            except Exception as e:
                elapsed = time.time() - start_time
                results[model_name]["failure_count"] += 1
                results[model_name]["errors"].append(f"Iteration {i+1}: {str(e)}")
                print(f"✗ Error: {e}")
            
            # Small delay between requests to avoid rate limiting
            time.sleep(0.5)
    
    # Calculate statistics
    print("\n" + "=" * 70)
    print("BENCHMARK RESULTS")
    print("=" * 70)
    
    summary = []
    
    for model_name, data in results.items():
        times = data["response_times"]
        
        if times:
            avg_time = sum(times) / len(times)
            min_time = min(times)
            max_time = max(times)
            success_rate = data["success_count"] / (data["success_count"] + data["failure_count"])
        else:
            avg_time = min_time = max_time = 0
            success_rate = 0
        
        data["avg_time"] = avg_time
        data["min_time"] = min_time
        data["max_time"] = max_time
        data["success_rate"] = success_rate
        
        # Suggest optimal timeout (avg + 2*std_dev or 1.5*max, whichever is smaller)
        if times and len(times) > 1:
            import statistics
            std_dev = statistics.stdev(times)
            suggested_timeout = min(avg_time + 2 * std_dev, max_time * 1.5)
        elif times:
            suggested_timeout = max_time * 1.5
        else:
            suggested_timeout = data["configured_timeout"]
        
        data["suggested_timeout"] = round(suggested_timeout, 1)
        
        summary.append({
            "name": model_name,
            "avg_time": avg_time,
            "success_rate": success_rate,
            "enabled": data["enabled"]
        })
        
        status = "✓" if data["success_count"] > 0 else "✗"
        print(f"\n{status} {model_name}")
        print(f"   Success Rate: {success_rate:.0%}")
        if times:
            print(f"   Avg Response: {avg_time:.2f}s")
            print(f"   Min/Max: {min_time:.2f}s / {max_time:.2f}s")
            print(f"   Configured Timeout: {data['configured_timeout']}s")
            print(f"   Suggested Timeout: {data['suggested_timeout']}s")
        if data["errors"]:
            print(f"   Errors: {len(data['errors'])}")
    
    # Sort by average time and print recommended order
    enabled_models = [m for m in summary if m["enabled"] and m["avg_time"] > 0]
    enabled_models.sort(key=lambda x: x["avg_time"])
    
    print("\n" + "=" * 70)
    print("RECOMMENDED MODEL ORDER (by avg response time)")
    print("=" * 70)
    
    for i, model in enumerate(enabled_models, 1):
        print(f"  {i}. {model['name']}: {model['avg_time']:.2f}s (success: {model['success_rate']:.0%})")
    
    # Save results to file
    report_path = os.path.join(os.path.dirname(__file__), "model_benchmark_report.json")
    with open(report_path, "w") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "iterations": iterations,
            "results": results,
            "recommended_order": [m["name"] for m in enabled_models]
        }, f, indent=2)
    
    print(f"\n📊 Report saved to: {report_path}")
    
    return results


def quick_test():
    """Quick connectivity test for all models."""
    print("\n" + "=" * 70)
    print("QUICK CONNECTIVITY TEST")
    print("=" * 70)
    
    provider = MultiModelProvider()
    results = provider.test_all_models()
    
    print("\nSummary:")
    for name, result in results.items():
        status = "✓" if result.get("status") == "success" else "✗" if result.get("status") == "failed" else "⏭️"
        time_str = result.get("response_time", "N/A")
        print(f"  {status} {name}: {result.get('status')} ({time_str})")


def test_racing():
    """Test the racing mechanism."""
    print("\n" + "=" * 70)
    print("RACING TEST")
    print("=" * 70)
    
    provider = MultiModelProvider()
    
    test_prompts = [
        "What is AI? Answer in one sentence.",
        "Count from 1 to 5.",
        "What color is the sky? One word answer.",
    ]
    
    for prompt in test_prompts:
        print(f"\nPrompt: {prompt}")
        start = time.time()
        response = provider.race_models(prompt)
        elapsed = time.time() - start
        print(f"Response ({elapsed:.2f}s): {response[:100]}...")
    
    print("\n--- Final Stats ---")
    stats = provider.get_stats()
    for name, stat in stats.items():
        if stat.get("total_requests", 0) > 0:
            print(f"  {name}: {stat}")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Multi-Model Benchmark Tool")
    parser.add_argument("--quick", action="store_true", help="Quick connectivity test only")
    parser.add_argument("--race", action="store_true", help="Test racing mechanism")
    parser.add_argument("--full", action="store_true", help="Full benchmark (3 iterations)")
    parser.add_argument("--iterations", type=int, default=3, help="Number of iterations for full test")
    
    args = parser.parse_args()
    
    if args.quick:
        quick_test()
    elif args.race:
        test_racing()
    elif args.full or not any([args.quick, args.race]):
        run_benchmark(args.iterations)
