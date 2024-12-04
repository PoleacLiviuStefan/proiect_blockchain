# config.py
from supabase import create_client
from dotenv import load_dotenv
import os

SUPABASE_URL = 'https://ifkpybpmiwuzkgsboift.supabase.co'  # Înlocuiește cu URL-ul tău

supabase = create_client(SUPABASE_URL, os.getenv("SUPABASE_KEY"))
