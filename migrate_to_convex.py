import json
import os

def migrate():
    with open('/home/ubuntu/upload/supabase_data_export.json', 'r') as f:
        data = json.load(f)
    
    os.makedirs('convex_data', exist_ok=True)
    
    for table_name, rows in data.items():
        if rows is None:
            continue
            
        convex_rows = []
        for row in rows:
            # Preserve original ID as supabase_id
            if 'id' in row:
                row['supabase_id'] = row['id']
                # Note: Convex will generate its own _id
                # For now, we keep the original columns and Convex will validate against schema
            convex_rows.append(row)
            
        with open(f'convex_data/{table_name}.jsonl', 'w') as f:
            for row in convex_rows:
                f.write(json.dumps(row) + '\n')
                
    print("Migration files created in convex_data/")

if __name__ == "__main__":
    migrate()
