from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from config import supabase  # Importă clientul configurat în config.py

app = FastAPI()

# Configurare CORS
origins = [
    'http://localhost:3000',
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exemplu: Adaugă un element în tabelul Supabase
@app.post("/add-item")
async def add_item(item: dict):
    try:
        response = supabase.table("your_table_name").insert(item).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Exemplu: Obține toate elementele din tabel
@app.get("/get-items")
async def get_items():
    try:
        response = supabase.table("your_table_name").select("*").execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
