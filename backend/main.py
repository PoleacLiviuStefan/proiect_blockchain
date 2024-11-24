from fastapi import FastAPI, HTTPException, Depends
import models
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()

origins = [
    'http://localhost:3000'
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins
)

