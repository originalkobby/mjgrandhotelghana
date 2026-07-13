import os
import json
import requests

# YOUR CONFIGURATION
SUPABASE_URL = "https://vfnqvwtcjtclprapzlvm.supabase.co"
# Paste your Service Role Key here inside the quotes
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmbnF2d3RjanRjbHByYXB6bHZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExMDgzMiwiZXhwIjoyMDg3Njg2ODMyfQ.1eI6oWQreS066rr9NmqsMXxCaZRJkRusThtUjXzIn-s"

TABLES = [
    "guests", "rooms", "room_inventory", "seasonal_pricing", 
    "cancellation_policies", "add_ons", "promotions", "bookings", 
    "booking_add_ons", "payment_logs", "contact_messages", 
    "booking_audit_log", "menu_items", "webhook_logs", 
    "revenue_forecasts", "demand_alerts", "revenue_streams", 
    "gallery_images", "profiles", "user_roles",
    "conversations", "support_tickets"
]

def export_table(table_name ):
    print(f"Exporting {table_name}...")
    headers = {"apikey": SUPABASE_SERVICE_ROLE_KEY, "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}"}
    url = f"{SUPABASE_URL}/rest/v1/{table_name}?select=*"
    response = requests.get(url, headers=headers)
    return response.json() if response.status_code == 200 else None

def main():
    if SUPABASE_SERVICE_ROLE_KEY == "YOUR_SERVICE_ROLE_KEY_HERE":
        print("Error: Please paste your Service Role Key into the script first!")
        return
    data = {table: export_table(table) for table in TABLES}
    with open("supabase_data_export.json", "w") as f:
        json.dump(data, f, indent=2)
    print("Done! 'supabase_data_export.json' has been created.")

if __name__ == "__main__":
    main()