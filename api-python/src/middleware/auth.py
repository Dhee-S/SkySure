import firebase_admin
from firebase_admin import credentials, auth
from fastapi import Request, HTTPException
import os

# Initialize Firebase Admin
# Expects Firebase service account key path in environment
service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "d:/Code/Guidwire/gigguard/api/serviceAccountKey.json")

if not firebase_admin._apps:
    cred = credentials.Certificate(service_account_path)
    firebase_admin.initialize_app(cred)

async def verify_token(request: Request):
    auth_header = request.headers.get("Authorization")
    
    # Bypass for local dev/testing
    if os.getenv("ENV") != "production" and auth_header == "Bearer mock-token":
        return {"uid": "mock-user-id", "email": "mock@example.com"}

    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    
    token = auth_header.split(" ")[1]
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
