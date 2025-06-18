import json
import random
from typing import List, Dict, Any

def load_slang_dataset(file_path: str) -> List[Dict[str, str]]:
    """Load the Gen Z slang dataset from JSON file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: File '{file_path}' not found!")
        return []
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON format in '{file_path}'!")
        return []

def generate_training_examples(slang_data: List[Dict[str, str]]) -> List[Dict[str, Any]]:
    """Generate training examples in Nebius-compatible JSONL format."""
    training_examples = []
    
    user_templates = [
        "omg {example}",
        "bro {example}",
        "literally {example}",
        "wait {example}",
        "nah {example}",
        "yo {example}",
        "bruh {example}",
        "{example}",
    ]
    
    response_templates = [
        "no cap that's {reaction}! {slang_usage}",
        "bruh that's {reaction} {slang_usage}",
        "fr? that's {reaction} {slang_usage}",
        "yooo that's {reaction}! {slang_usage}",
        "deadass? {reaction} {slang_usage}",
        "nah that's {reaction} {slang_usage}",
        "omg {reaction}! {slang_usage}",
        "wait that's {reaction} {slang_usage}",
        "{reaction}! {slang_usage}",
        "lowkey that's {reaction} {slang_usage}"
    ]
    
    reactions = ["crazy", "wild", "insane", "fire", "valid", "iconic", "based", "cringe", "mid"]
    
    for slang_item in slang_data:
        slang_term = str(slang_item["Slang"])
        description = str(slang_item["Description"])
        example = str(slang_item["Example"])
        context = str(slang_item["Context"])
        
        for _ in range(3):
            
            user_template = random.choice(user_templates)
            user_message = user_template.format(example=example.lower())
            
            reaction = random.choice(reactions)
            
            slang_usage_options = [
                f"{str(slang_term).lower()} hits different",
                f"that's such a {str(slang_term).lower()}",
                f"{str(slang_term).lower()} fr",
                f"total {str(slang_term).lower()}",
                f"straight up {str(slang_term).lower()}",
                f"{str(slang_term).lower()} energy",
                f"giving {str(slang_term).lower()} vibes"
            ]
            
            slang_usage = random.choice(slang_usage_options)
            response_template = random.choice(response_templates)
            assistant_message = response_template.format(reaction=reaction, slang_usage=slang_usage)
            
            training_example = {
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a Gen Z friend who talks casually using modern slang. You're supportive, relatable, and always ready to chat about anything. Use Gen Z slang naturally in your responses while being a good friend."
                    },
                    {
                        "role": "user", 
                        "content": user_message
                    },
                    {
                        "role": "assistant",
                        "content": assistant_message
                    }
                ]
            }
            
            training_examples.append(training_example)
        
        explanation_example = {
            "messages": [
                {
                    "role": "system",
                    "content": "You are a Gen Z friend who talks casually using modern slang. You're supportive, relatable, and always ready to chat about anything. Use Gen Z slang naturally in your responses while being a good friend."
                },
                {
                    "role": "user",
                    "content": f"what does {str(slang_term).lower()} mean?"
                },
                {
                    "role": "assistant", 
                    "content": f"oh {str(slang_term).lower()}? it means {description.lower()}! like {example.lower()} - {context.lower()} fr it's used a lot"
                }
            ]
        }
        
        training_examples.append(explanation_example)
        
        natural_example = {
            "messages": [
                {
                    "role": "system",
                    "content": "You are a Gen Z friend who talks casually using modern slang. You're supportive, relatable, and always ready to chat about anything. Use Gen Z slang naturally in your responses while being a good friend."
                },
                {
                    "role": "user",
                    "content": f"hey bestie how's your day going?"
                },
                {
                    "role": "assistant",
                    "content": f"yooo bestie! it's been pretty good ngl, just vibing. how about you? anything giving you a {str(slang_term).lower()} today? lol"
                }
            ]
        }
        
        training_examples.append(natural_example)
    
    return training_examples

def save_to_jsonl(training_examples: List[Dict[str, Any]], output_file: str):
    """Save training examples to JSONL format."""
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            for example in training_examples:
                f.write(json.dumps(example, ensure_ascii=False) + '\n')
        print(f"Successfully saved {len(training_examples)} training examples to '{output_file}'")
    except Exception as e:
        print(f"Error saving file: {e}")

def create_validation_split(training_examples: List[Dict[str, Any]], validation_ratio: float = 0.2):
    """Split the dataset into training and validation sets."""
    random.shuffle(training_examples)
    split_idx = int(len(training_examples) * (1 - validation_ratio))
    
    train_data = training_examples[:split_idx]
    val_data = training_examples[split_idx:]
    
    return train_data, val_data

def main():
    """Main function to convert Gen Z slang dataset to Nebius format."""
    input_file = "all_slangs.json"
    output_train_file = "genz_slang_train.jsonl"
    output_val_file = "genz_slang_validation.jsonl"
    
    print("Converting dataset for Nebius Fine-tuning...")
    
    slang_data = load_slang_dataset(input_file)
    if not slang_data:
        print("Failed to load dataset. Please check your file path and format.")
        return
    
    print(f"📚 Loaded {len(slang_data)} slang terms")
    
    training_examples = generate_training_examples(slang_data)
    print(f"✨ Generated {len(training_examples)} training examples")
    
    train_data, val_data = create_validation_split(training_examples, validation_ratio=0.15)
    
    save_to_jsonl(train_data, output_train_file)
    save_to_jsonl(val_data, output_val_file)
    
    print(f"\nConversion complete!")
    print(f"Training set: {len(train_data)} examples → {output_train_file}")
    print(f"Validation set: {len(val_data)} examples → {output_val_file}")

if __name__ == "__main__":
    main()