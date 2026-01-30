"""
Multi-Model Provider with Concurrent Racing
============================================
Queries multiple LLM models simultaneously and uses the first valid response.
All models compete equally - fastest response wins.
"""

import os
import time
import requests
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, field
from dotenv import load_dotenv
from langsmith import traceable

load_dotenv()

# =============================================================================
# Model Configuration (ordered by increasing timeout)
# =============================================================================

@dataclass
class ModelConfig:
    """Configuration for a single model."""
    name: str
    timeout: float  # seconds
    provider: str  # "openrouter" or "google"
    model_id: str
    priority: int  # Lower = higher priority
    enabled: bool = True
    
    # Stats tracking
    total_requests: int = field(default=0, repr=False)
    successful_requests: int = field(default=0, repr=False)
    total_response_time: float = field(default=0.0, repr=False)
    
    @property
    def avg_response_time(self) -> float:
        if self.successful_requests == 0:
            return 0.0
        return self.total_response_time / self.successful_requests
    
    @property
    def success_rate(self) -> float:
        if self.total_requests == 0:
            return 0.0
        return self.successful_requests / self.total_requests


# Default model configurations (ordered by priority/expected response time)
# NOTE: Tested 2024-01-29. Working models: z-ai/glm-4.5-air, deepseek/deepseek-r1
# Other models may require valid API keys or have availability issues
DEFAULT_MODELS = [
    # Primary: Working reliably in tests (ordered by response time)
    ModelConfig(
        name="z-ai/glm-4.5-air",
        timeout=20.0,  # Tested: ~16s, adding buffer
        provider="openrouter",
        model_id="z-ai/glm-4.5-air:free",
        priority=1  # Primary - fastest working model
    ),
    ModelConfig(
        name="deepseek/deepseek-r1",
        timeout=35.0,  # Tested: ~30s, adding buffer
        provider="openrouter",
        model_id="deepseek/deepseek-r1-0528:free",
        priority=2  # Secondary - slower but reliable
    ),
    # Below models need valid API keys or may have availability issues
    ModelConfig(
        name="xiaomi/mimo-v2-flash",
        timeout=8.0,
        provider="openrouter",
        model_id="xiaomi/mimo-v2-flash:free",
        priority=3
    ),
    ModelConfig(
        name="gemini-2.0-flash",
        timeout=10.0,
        provider="google",
        model_id="gemini-2.0-flash",
        priority=4  # NOTE: Current API key may be invalid
    ),
    ModelConfig(
        name="mistralai/devstral",
        timeout=15.0,
        provider="openrouter",
        model_id="mistralai/devstral-2512:free",
        priority=5
    ),
    ModelConfig(
        name="qwen/qwen3-coder",
        timeout=15.0,
        provider="openrouter",
        model_id="qwen/qwen3-coder:free",
        priority=6
    ),
    ModelConfig(
        name="tngtech/deepseek-chimera",
        timeout=30.0,
        provider="openrouter",
        model_id="tngtech/deepseek-chimera",
        priority=7
    ),
]


# =============================================================================
# Multi-Model Provider
# =============================================================================

class MultiModelProvider:
    """
    Concurrent multi-model provider that races all models simultaneously.
    First valid response wins.
    """
    
    OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
    
    def __init__(self, models: Optional[List[ModelConfig]] = None):
        self.models = models or DEFAULT_MODELS.copy()
        self.openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
        self.google_api_key = os.getenv("GOOGLE_API_KEY")
        self._lock = threading.Lock()
        self._response_stats: Dict[str, List[float]] = {}
        
        # Validate API keys
        self._validate_api_keys()
        
        # Initialize LangChain Gemini model
        self._gemini_llm = None
        self._init_gemini()
    
    def _validate_api_keys(self):
        """Validate required API keys."""
        print("=" * 50)
        print("Multi-Model Provider - API Key Validation")
        print("=" * 50)
        
        if self.openrouter_api_key:
            print(f"✓ OPENROUTER_API_KEY: Found ({len(self.openrouter_api_key)} chars)")
        else:
            print("✗ OPENROUTER_API_KEY: Not found - OpenRouter models will be disabled")
            # Disable OpenRouter models
            for model in self.models:
                if model.provider == "openrouter":
                    model.enabled = False
        
        if self.google_api_key:
            print(f"✓ GOOGLE_API_KEY: Found ({len(self.google_api_key)} chars)")
        else:
            print("✗ GOOGLE_API_KEY: Not found - Gemini model will be disabled")
            for model in self.models:
                if model.provider == "google":
                    model.enabled = False
        
        enabled_count = sum(1 for m in self.models if m.enabled)
        print(f"\n✓ {enabled_count}/{len(self.models)} models enabled")
        print("=" * 50)
    
    def _init_gemini(self):
        """Initialize Gemini LLM using LangChain."""
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            self._gemini_llm = ChatGoogleGenerativeAI(
                model="gemini-2.0-flash",
                temperature=0.5
            )
            print("✓ Gemini LLM initialized via LangChain")
        except Exception as e:
            print(f"✗ Failed to initialize Gemini LLM: {e}")
            for model in self.models:
                if model.provider == "google":
                    model.enabled = False
    
    @traceable(name="Call OpenRouter", run_type="llm")
    def _call_openrouter(self, model: ModelConfig, messages: List[Dict]) -> Optional[str]:
        """Call OpenRouter API for a specific model."""
        start_time = time.time()
        model.total_requests += 1
        
        try:
            headers = {
                "Authorization": f"Bearer {self.openrouter_api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "ChatX"
            }
            
            payload = {
                "model": model.model_id,
                "messages": messages,
                "max_tokens": 4096,
                "temperature": 0.5
            }
            
            response = requests.post(
                self.OPENROUTER_API_URL,
                headers=headers,
                json=payload,
                timeout=model.timeout
            )
            
            elapsed = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if "choices" in data and len(data["choices"]) > 0:
                    content = data["choices"][0].get("message", {}).get("content", "")
                    if content:
                        # Update stats
                        model.successful_requests += 1
                        model.total_response_time += elapsed
                        
                        print(f"[MultiModel] ✓ {model.name} responded in {elapsed:.2f}s")
                        return content
            
            print(f"[MultiModel] ✗ {model.name} failed: HTTP {response.status_code}")
            return None
            
        except requests.exceptions.Timeout:
            elapsed = time.time() - start_time
            print(f"[MultiModel] ✗ {model.name} timeout after {elapsed:.2f}s")
            return None
        except Exception as e:
            print(f"[MultiModel] ✗ {model.name} error: {e}")
            return None
    
    @traceable(name="Call Gemini", run_type="llm")
    def _call_gemini(self, model: ModelConfig, messages: List[Dict]) -> Optional[str]:
        """Call Gemini via LangChain."""
        start_time = time.time()
        model.total_requests += 1
        
        try:
            if not self._gemini_llm:
                print(f"[MultiModel] ✗ {model.name}: LLM not initialized")
                return None
            
            # Convert messages to LangChain format
            from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
            
            lc_messages = []
            for msg in messages:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                
                if role == "system":
                    lc_messages.append(SystemMessage(content=content))
                elif role == "assistant":
                    lc_messages.append(AIMessage(content=content))
                else:
                    lc_messages.append(HumanMessage(content=content))
            
            # Call with timeout using threading
            result = [None]
            exception = [None]
            
            def call_gemini():
                try:
                    response = self._gemini_llm.invoke(lc_messages)
                    result[0] = response.content if hasattr(response, 'content') else str(response)
                except Exception as e:
                    exception[0] = e
            
            thread = threading.Thread(target=call_gemini)
            thread.start()
            thread.join(timeout=model.timeout)
            
            elapsed = time.time() - start_time
            
            if thread.is_alive():
                print(f"[MultiModel] ✗ {model.name} timeout after {elapsed:.2f}s")
                return None
            
            if exception[0]:
                print(f"[MultiModel] ✗ {model.name} error: {exception[0]}")
                return None
            
            if result[0]:
                model.successful_requests += 1
                model.total_response_time += elapsed
                print(f"[MultiModel] ✓ {model.name} responded in {elapsed:.2f}s")
                return result[0]
            
            return None
            
        except Exception as e:
            print(f"[MultiModel] ✗ {model.name} error: {e}")
            return None
    
    def _call_model(self, model: ModelConfig, messages: List[Dict]) -> Optional[str]:
        """Call a model based on its provider."""
        if not model.enabled:
            return None
        
        print(f"[MultiModel] Starting {model.name} (timeout: {model.timeout}s)...")
        
        if model.provider == "openrouter":
            return self._call_openrouter(model, messages)
        elif model.provider == "google":
            return self._call_gemini(model, messages)
        else:
            print(f"[MultiModel] Unknown provider: {model.provider}")
            return None
    
    @traceable(name="Multi-Model Race", run_type="chain")
    def race_models(self, messages: Any) -> str:
        """
        Race all models concurrently. First valid response wins.
        
        Args:
            messages: Either a list of dict messages or LangChain message objects
            
        Returns:
            The response content from the fastest model
        """
        # Convert messages to standard format
        std_messages = self._standardize_messages(messages)
        
        enabled_models = [m for m in self.models if m.enabled]
        
        if not enabled_models:
            return "Error: No models are enabled. Please check your API keys."
        
        print(f"\n[MultiModel] Racing {len(enabled_models)} models...")
        
        # Use ThreadPoolExecutor to race all models
        with ThreadPoolExecutor(max_workers=len(enabled_models)) as executor:
            # Submit all model calls
            future_to_model = {
                executor.submit(self._call_model, model, std_messages): model
                for model in enabled_models
            }
            
            # Return first successful response
            for future in as_completed(future_to_model):
                model = future_to_model[future]
                try:
                    result = future.result()
                    if result:
                        print(f"[MultiModel] 🏆 Winner: {model.name}")
                        # Cancel remaining futures (best effort)
                        for f in future_to_model:
                            f.cancel()
                        return result
                except Exception as e:
                    print(f"[MultiModel] Future error for {model.name}: {e}")
        
        return "I apologize, but all AI models are currently unavailable. Please try again later."
    
    def _standardize_messages(self, messages: Any) -> List[Dict]:
        """Convert various message formats to standard dict format."""
        if isinstance(messages, list):
            if len(messages) == 0:
                return []
            
            # If already dict format
            if isinstance(messages[0], dict):
                return messages
            
            # LangChain message objects
            result = []
            for msg in messages:
                if hasattr(msg, 'type'):
                    msg_type = msg.type
                    content = msg.content if hasattr(msg, 'content') else str(msg)
                    
                    if msg_type == 'human':
                        result.append({"role": "user", "content": content})
                    elif msg_type == 'ai':
                        result.append({"role": "assistant", "content": content})
                    elif msg_type == 'system':
                        result.append({"role": "system", "content": content})
                    else:
                        result.append({"role": "user", "content": content})
                else:
                    result.append({"role": "user", "content": str(msg)})
            
            return result
        
        # Single message string
        return [{"role": "user", "content": str(messages)}]
    
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics for all models."""
        return {
            model.name: {
                "enabled": model.enabled,
                "total_requests": model.total_requests,
                "successful_requests": model.successful_requests,
                "success_rate": f"{model.success_rate:.1%}",
                "avg_response_time": f"{model.avg_response_time:.2f}s"
            }
            for model in self.models
        }
    
    def test_all_models(self) -> Dict[str, Any]:
        """Test all models with a simple prompt."""
        test_messages = [{"role": "user", "content": "Say 'Hello' in one word."}]
        results = {}
        
        print("\n" + "=" * 60)
        print("Testing All Models")
        print("=" * 60)
        
        for model in self.models:
            if not model.enabled:
                results[model.name] = {"status": "disabled"}
                continue
            
            start = time.time()
            response = self._call_model(model, test_messages)
            elapsed = time.time() - start
            
            results[model.name] = {
                "status": "success" if response else "failed",
                "response_time": f"{elapsed:.2f}s",
                "response_preview": response[:50] if response else None
            }
        
        print("\n" + "=" * 60)
        return results


# =============================================================================
# Singleton Instance
# =============================================================================

_provider_instance: Optional[MultiModelProvider] = None

def get_provider() -> MultiModelProvider:
    """Get or create the singleton provider instance."""
    global _provider_instance
    if _provider_instance is None:
        _provider_instance = MultiModelProvider()
    return _provider_instance


def race_models(messages: Any) -> str:
    """Convenience function to race models."""
    return get_provider().race_models(messages)


# =============================================================================
# CLI Testing
# =============================================================================

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("Multi-Model Provider - Test Mode")
    print("=" * 60)
    
    provider = MultiModelProvider()
    
    # Test all models individually
    print("\n--- Testing individual models ---")
    results = provider.test_all_models()
    
    for model_name, result in results.items():
        status = "✓" if result.get("status") == "success" else "✗"
        time_str = result.get("response_time", "N/A")
        print(f"{status} {model_name}: {result.get('status')} ({time_str})")
    
    # Test racing
    print("\n--- Testing model racing ---")
    response = provider.race_models("What is 2 + 2? Answer in one word.")
    print(f"\nRace winner response: {response[:100]}...")
    
    # Print stats
    print("\n--- Model Statistics ---")
    stats = provider.get_stats()
    for name, stat in stats.items():
        print(f"{name}: {stat}")
