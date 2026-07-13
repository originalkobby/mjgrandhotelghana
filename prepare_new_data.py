import json
import os

def clean_record(record):
    """
    Convex does not like explicit 'null' values for fields marked as optional.
    This function removes any keys that have a value of None (null).
    """
    return {k: v for k, v in record.items() if v is not None}

def transform_for_native_convex(input_file, output_dir):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    if not os.path.exists(input_file):
        print(f"Error: {input_file} not found. Run the export script first!")
        return

    with open(input_file, 'r') as f:
        data = json.load(f)

    for table_name, records in data.items():
        if records is None:
            print(f"Skipping {table_name} (no data)")
            continue
        
        output_file = os.path.join(output_dir, f"{table_name}.jsonl")
        with open(output_file, 'w') as out:
            for record in records:
                # 1. Clean out the NULL values
                cleaned = clean_record(record)
                
                # 2. Keep the original 'id' as 'supabase_id' for reference
                if 'id' in record:
                    cleaned['supabase_id'] = record['id']
                
                out.write(json.dumps(cleaned) + '\n')
    
    print(f"Success! Your data is now CLEAN and ready in the '{output_dir}' folder.")

if __name__ == "__main__":
    transform_for_native_convex('supabase_data_export.json', 'new_convex_data')
