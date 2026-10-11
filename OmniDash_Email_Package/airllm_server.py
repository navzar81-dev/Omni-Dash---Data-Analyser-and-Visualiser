"""
AirLLM Local Inference Companion Server
---------------------------------------
Runs local LLMs (even 70B models) on laptops with low VRAM / 8GB RAM using AirLLM layer-streaming.
Exposes an OpenAI-compatible REST API for the OmniDash Business Intelligence Dashboard.

Requirements:
    pip install airllm fastapi uvicorn pydantic torch

Usage:
    python airllm_server.py --model_path /path/to/local/model --port 8000
    or
    python airllm_server.py --model_path meta-llama/Llama-3.2-1B-Instruct --port 8000
"""

import argparse
import sys
import time
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="OmniDash AirLLM Local Server",
    description="Local offline AI inference server powered by AirLLM layer-by-layer offloading"
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model state
MODEL_INSTANCE = None
MODEL_PATH = None
MODEL_STATUS = "Not Loaded"


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatCompletionRequest(BaseModel):
    model: Optional[str] = "local-airllm"
    messages: List[ChatMessage]
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 512
    stream: Optional[bool] = False


@app.get("/api/status")
def get_status():
    return {
        "status": MODEL_STATUS,
        "model_path": MODEL_PATH,
        "engine": "AirLLM Layer-Offloading",
        "timestamp": time.time()
    }


@app.get("/v1/models")
def list_models():
    return {
        "object": "list",
        "data": [
            {
                "id": MODEL_PATH or "local-airllm",
                "object": "model",
                "owned_by": "local-airllm"
            }
        ]
    }


@app.post("/v1/chat/completions")
def chat_completions(req: ChatCompletionRequest):
    global MODEL_INSTANCE, MODEL_STATUS

    if MODEL_INSTANCE is None:
        # Fallback simulation if model is not loaded yet
        return {
            "id": f"chatcmpl-{int(time.time())}",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": req.model,
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": (
                            "[AirLLM Server Running] The server is active, but no heavy PyTorch model "
                            "is currently instantiated into memory. To run with active weights, pass "
                            "--model_path when launching: `python airllm_server.py --model_path /path/to/weights`."
                        )
                    },
                    "finish_reason": "stop"
                }
            ],
            "usage": {"prompt_tokens": 50, "completion_tokens": 40, "total_tokens": 90}
        }

    try:
        # Format chat messages into prompt
        prompt = ""
        for m in req.messages:
            prompt += f"<|im_start|>{m.role}\n{m.content}<|im_end|>\n"
        prompt += "<|im_start|>assistant\n"

        # Execute generation via AirLLM
        input_tokens = MODEL_INSTANCE.tokenizer(
            [prompt],
            return_tensors="pt",
            truncation=True,
            max_length=2048
        )
        generation_output = MODEL_INSTANCE.generate(
            input_tokens['input_ids'].cuda() if hasattr(input_tokens['input_ids'], 'cuda') else input_tokens['input_ids'],
            max_new_tokens=req.max_tokens or 256,
            use_cache=True,
            return_dict_in_generate=True
        )

        output = MODEL_INSTANCE.tokenizer.decode(generation_output.sequences[0], skip_special_tokens=True)
        # Strip prompt
        if prompt in output:
            output = output.replace(prompt, "").strip()

        return {
            "id": f"chatcmpl-{int(time.time())}",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": req.model,
            "choices": [
                {
                    "index": 0,
                    "message": {"role": "assistant", "content": output},
                    "finish_reason": "stop"
                }
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")


def load_airllm_model(model_path: str):
    global MODEL_INSTANCE, MODEL_PATH, MODEL_STATUS
    print(f"[*] Initializing AirLLM model from: {model_path}...")
    try:
        from airllm import AutoModel
        MODEL_INSTANCE = AutoModel.from_pretrained(model_path)
        MODEL_PATH = model_path
        MODEL_STATUS = "Ready"
        print(f"[+] AirLLM model loaded successfully.")
    except ImportError:
        print("[!] Warning: 'airllm' is not installed in the active Python environment.")
        print("[!] Install it with: pip install airllm")
        MODEL_STATUS = "AirLLM Not Installed"
    except Exception as e:
        print(f"[!] Error loading model: {e}")
        MODEL_STATUS = f"Error: {e}"


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="OmniDash AirLLM Inference Server")
    parser.add_argument("--model_path", type=str, default=None, help="Local directory or HuggingFace repo path for the model")
    parser.add_argument("--port", type=int, default=8000, help="Port to run server on")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Host interface")
    args = parser.parse_args()

    if args.model_path:
        load_airllm_model(args.model_path)
    else:
        print("[*] Starting server without preloaded model. You can point the dashboard to this server.")

    import uvicorn
    uvicorn.run(app, host=args.host, port=args.port)
