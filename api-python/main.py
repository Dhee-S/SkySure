from fastapi import FastAPI, Request
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from src.routes import rider_routes, simulation_routes, payment_routes

app = FastAPI(title="SkySure Phase 3 API", version="3.0.0")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root healthy check
@app.get("/")
async def root():
    return {"status": "healthy", "service": "SkySure-PH3-API", "datastore": "Firestore"}

# Include routes
app.include_router(rider_routes.router, prefix="/api")
app.include_router(simulation_routes.router, prefix="/api")
app.include_router(payment_routes.router, prefix="/api")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
