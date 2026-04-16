from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = "https://rvroifyyqmdrrykyypsq.supabase.co"
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2cm9pZnl5cW1kcnJ5a3l5cHNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTMzODUsImV4cCI6MjA5MTgyOTM4NX0.yPLIWD-D9HKKq4h4RhIChUgyT18EztRfcsp6ISrfx20")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
