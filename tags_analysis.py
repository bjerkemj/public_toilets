import json
import sys
from collections import defaultdict

def extract_tags_and_values(file_path):
    """
    Extract all unique tags and their possible values from a JSON file.
    
    Args:
        file_path (str): Path to the JSON file
    
    Returns:
        dict: Dictionary with tags as keys and lists of unique values as values
    """
    try:
        # Read the JSON file
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Check if 'elements' key exists
        if 'elements' not in data:
            print("Error: 'elements' key not found in the JSON file.")
            return None
        
        elements = data['elements']
        print(f"Processing {len(elements)} elements...")
        
        # Dictionary to store tags and their values
        tag_values = defaultdict(set)
        
        # Process each element
        for element in elements:
            if 'tags' in element:
                for tag, value in element['tags'].items():
                    tag_values[tag].add(str(value))
        
        # Convert sets to sorted lists for better readability
        result = {}
        for tag, values in tag_values.items():
            result[tag] = sorted(list(values))
        
        return result
        
    except FileNotFoundError:
        print(f"Error: File '{file_path}' not found.")
        return None
    except json.JSONDecodeError:
        print("Error: Invalid JSON format in the file.")
        return None
    except Exception as e:
        print(f"Error processing file: {e}")
        return None

def print_tags_summary(tag_values):
    """
    Print a summary of tags and their values.
    
    Args:
        tag_values (dict): Dictionary with tags and their possible values
    """
    print("\n" + "="*60)
    print("TAG ANALYSIS SUMMARY")
    print("="*60)
    
    print(f"Total unique tags found: {len(tag_values)}")
    
    # Sort tags by frequency (number of unique values)
    sorted_tags = sorted(tag_values.items(), key=lambda x: len(x[1]), reverse=True)
    
    print("\nTags sorted by number of unique values:")
    print("-" * 40)
    
    for tag, values in sorted_tags:
        print(f"\n{tag}: ({len(values)} unique values)")
        
        # Show all values if there are few, otherwise show first few and indicate more
        if len(values) <= 10:
            for value in values:
                print(f"  - {value}")
        else:
            for value in values[:8]:
                print(f"  - {value}")
            print(f"  ... and {len(values) - 8} more values")

def save_results_to_file(tag_values, output_file):
    """
    Save the results to a JSON file.
    
    Args:
        tag_values (dict): Dictionary with tags and their possible values
        output_file (str): Path to the output file
    """
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(tag_values, f, indent=2, ensure_ascii=False)
        print(f"\nResults saved to: {output_file}")
    except Exception as e:
        print(f"Error saving results: {e}")

def main():
    """Main function to run the script."""
    if len(sys.argv) != 2:
        print("Usage: python script.py <json_file_path>")
        print("Example: python script.py toilets_norway_20250623_151225.json")
        return
    
    file_path = sys.argv[1]
    
    print("JSON Tag and Value Extractor")
    print("=" * 30)
    print(f"Processing file: {file_path}")
    
    # Extract tags and values
    tag_values = extract_tags_and_values(file_path)
    
    if tag_values is None:
        return
    
    # Print summary
    print_tags_summary(tag_values)
    
    # Save results to file
    output_file = file_path.replace('.json', '_tags_analysis.json')
    save_results_to_file(tag_values, output_file)
    
    print("\n" + "="*60)
    print("Analysis complete!")

if __name__ == "__main__":
    main()