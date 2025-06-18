import os
import subprocess
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

def merge_lora(base_model_id: str, lora_dir: str, merged_dir: str):
    """
    Merge a base HuggingFace model with a LoRA adapter and save the merged checkpoint.

    :param base_model_id: HuggingFace identifier or local path of the base model
    :param lora_dir: Local path to the LoRA adapter directory
    :param merged_dir: Output directory for the merged model
    """
    # Load base model
    base = AutoModelForCausalLM.from_pretrained(base_model_id, torch_dtype="auto")
    # Load LoRA adapter
    lora_model = PeftModel.from_pretrained(base, lora_dir)
    # Merge and unload adapter
    merged = lora_model.merge_and_unload()
    # Save merged model
    os.makedirs(merged_dir, exist_ok=True)
    merged.save_pretrained(merged_dir)
    print(f"Merged model saved to {merged_dir}")


def export_to_webllm(merged_dir: str, output_dir: str, dtype: str = "float16"):
    """
    Convert a HuggingFace-style merged checkpoint to MLC WebLLM gguf format.

    Requires installation of the 'mlc-llm' CLI.

    :param merged_dir: Directory of the merged HF checkpoint
    :param output_dir: Directory to save the .gguf model
    :param dtype: Data type for quantization (e.g., float16, q4f16_ft)
    """
    os.makedirs(output_dir, exist_ok=True)
    cmd = [
        "mlc.llm.export",
        f"--model-dir={merged_dir}",
        "--export-format=gguf",
        f"--dtype={dtype}",
        f"--out-dir={output_dir}"
    ]
    print("Running WebLLM export:", " ".join(cmd))
    subprocess.run(cmd, check=True)
    print(f"WebLLM model exported to {output_dir}")


if __name__ == '__main__':
    # Example usage
    BASE_MODEL = "meta-llama/Meta-Llama-3.1-8B-Instruct"
    LORA_DIR = "./adapter_model"
    MERGED_DIR = "./merged_model"
    WEBLLM_OUT = "./webllm_model"

    merge_lora(BASE_MODEL, LORA_DIR, MERGED_DIR)
    export_to_webllm(MERGED_DIR, WEBLLM_OUT, dtype="float16")
