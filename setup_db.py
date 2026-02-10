import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Supabase credentials not found in .env")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def setup():
    print("Checking 'students' table...")
    try:
        response = supabase.table("students").select("*").execute()
        print(f"Fetch success. Count: {len(response.data)}")
        
        if len(response.data) == 0:
            print("Table is empty. Seeding data...")
            dummy_data = [
                {"roll": "CS-101", "name": "Alice Johnson", "phone": "+919876543210", "status": "Absent", "parent_name": "Mr. Johnson"},
                {"roll": "CS-102", "name": "Bob Smith", "phone": "+919988776655", "status": "Present", "parent_name": "Mrs. Smith"},
                {"roll": "CS-103", "name": "Charlie Davis", "phone": "+910000000000", "status": "Present", "parent_name": "Mr. Davis"},
            ]
            for student in dummy_data:
                supabase.table("students").insert(student).execute()
            print("Seeding complete.")
        else:
            print("Table already has data.")
            
    except Exception as e:
        print(f"Error accessing table: {e}")
        print("\n!!! IMPORTANT !!!")
        print("It seems the 'students' table does not exist.")
        print("Please run the SQL commands from 'schema.sql' in your Supabase SQL Editor.")

if __name__ == "__main__":
    setup()
