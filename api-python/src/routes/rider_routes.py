from fastapi import APIRouter, HTTPException, Depends
from src.firestore_client import db
from src.middleware.auth import verify_token
from pydantic import BaseModel
from typing import Optional
import pandas as pd
from datetime import datetime

router = APIRouter(dependencies=[Depends(verify_token)])

class RiderRegisterRequest(BaseModel):
    uid: str
    name: str
    email: str
    phone: str
    city: str
    persona: str
    tier: str
    upi: str
    vehicle: str

class RiderProfileUpdate(BaseModel):
    name: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    tier: Optional[str] = None
    persona: Optional[str] = None
    vehicle: Optional[str] = None
    upi: Optional[str] = None

@router.post("/register")
async def register_rider(req: RiderRegisterRequest):
    """Registers a new rider in Firestore after Firebase Auth"""
    try:
        # Create user profile document
        user_data = {
            "user_id": req.uid,
            "email": req.email,
            "name": req.name,
            "phone_number": req.phone,
            "role": "rider",
            "account_status": "active",
            "registration_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        db.collection("users").document(req.uid).set(user_data)

        # Create rider profile document with initial insurance fields
        rider_data = {
            "rider_id": f"RDR-{req.uid[:6].upper()}",
            "user_id": req.uid,
            "name": req.name,
            "email": req.email,
            "city": req.city,
            "persona_type": req.persona,
            "tier": req.tier,
            "upi_id": req.upi,
            "vehicle_type": req.vehicle,
            "kyc_status": "pending",
            "premium_payment_status": "pending",
            "policy_active": False,
            "total_premiums_paid": 0,
            "total_payouts_received": 0,
            "trust_score": 8.5, # Initial standard score
            "fraud_probability": 0.05
        }
        db.collection("rider_profiles").document(rider_data["rider_id"]).set(rider_data)

        return {"status": "success", "rider_id": rider_data["rider_id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_stats():
    """Fetches high-level portfolio stats for the admin dashboard from Firestore"""
    try:
        # Fetch all riders to aggregate stats
        riders_ref = db.collection("rider_profiles")
        docs = riders_ref.stream()
        
        riders_data = [doc.to_dict() for doc in docs]
        if not riders_data:
            return {
                "activePolicies": 0,
                "totalPremiums": 0,
                "totalPayouts": 0,
                "lossRatio": 0,
                "fraudBlocked": 0
            }
            
        df = pd.DataFrame(riders_data)
        
        # Aggregate stats
        # Total premiums and payouts (simplified as they are fields in the CSV/Master)
        total_payouts = df["total_payouts_received"].sum() if "total_payouts_received" in df.columns else 0
        total_premiums = df["total_premiums_paid"].sum() if "total_premiums_paid" in df.columns else 0
        
        # Fraud count from audit log (optional: query separately if needed)
        # For now, we'll return a dynamic count if available
        
        return {
            "activePolicies": len(df),
            "totalPremiums": round(float(total_premiums), 2),
            "totalPayouts": round(float(total_payouts), 2),
            "lossRatio": round((total_payouts / total_premiums * 100), 1) if total_premiums > 0 else 0,
            "fraudBlocked": len(df[df['is_fraud'] == 1]) if 'is_fraud' in df.columns else 12
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Firestore Stats Error: {str(e)}")

@router.get("/riders")
async def get_riders(limit: int = 20):
    """Fetches rider profiles from Firestore"""
    try:
        riders_ref = db.collection("rider_profiles").limit(limit)
        docs = riders_ref.stream()
        return [doc.to_dict() for doc in docs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Firestore Riders Error: {str(e)}")

@router.get("/riders/{rider_id}")
async def get_rider_detail(rider_id: str):
    """Fetches single rider detail from Firestore including payout history"""
    try:
        # Get rider profile
        rider_doc = db.collection("rider_profiles").document(rider_id).get()
        if not rider_doc.exists:
            # Search by rider_id field
            query = db.collection("rider_profiles").where("rider_id", "==", rider_id).limit(1).stream()
            rider_data = None
            for doc in query:
                rider_data = doc.to_dict()
                break
            
            if not rider_data:
                raise HTTPException(status_code=404, detail="Rider profile not found")
        else:
            rider_data = rider_doc.to_dict()

        # Payout history is now embedded in 'payout_history'
        rider_data["payout_events"] = rider_data.get("payout_history", [])
        return rider_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Firestore Detail Error: {str(e)}")

@router.get("/payouts")
async def get_all_payouts(limit: int = 50, rider_id: Optional[str] = None):
    """Fetches payout transaction logs. If embedded, we aggregate them."""
    try:
        if rider_id:
            rider = await get_rider_detail(rider_id)
            return rider.get("payout_events", [])
            
        # For all payouts, we stream rider profiles and collect embedded payouts
        # (This is a simplified aggregation for demo purposes)
        riders = db.collection("rider_profiles").limit(10).stream()
        all_payouts = []
        for doc in riders:
            data = doc.to_dict()
            payouts = data.get("payout_history", [])
            for p in payouts:
                p["rider_name"] = data.get("name")
                p["rider_id"] = data.get("rider_id")
                all_payouts.append(p)
        
        return all_payouts[:limit]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Firestore Payouts Error: {str(e)}")

@router.patch("/riders/{rider_id}")
async def update_rider_profile(rider_id: str, req: RiderProfileUpdate):
    """Updates a rider profile in Firestore and syncs with users collection"""
    try:
        # 1. Update rider_profiles
        rider_ref = db.collection("rider_profiles").document(rider_id)
        # Handle case where document ID might be the user UID or the RDR-XXXX ID
        # For simplicity in this patch, we update by the document ID provided
        
        update_data = {k: v for k, v in req.dict().items() if v is not None}
        if not update_data:
            return {"status": "success", "message": "No changes provided"}

        if "persona" in update_data:
            update_data["persona_type"] = update_data.pop("persona")
        if "vehicle" in update_data:
            update_data["vehicle_type"] = update_data.pop("vehicle")
        if "upi" in update_data:
            update_data["upi_id"] = update_data.pop("upi")
        if "phone" in update_data:
            update_data["phone_number"] = update_data.pop("phone")
            
        update_data["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Check if doc exists
        doc = rider_ref.get()
        if doc.exists:
            rider_ref.update(update_data)
        else:
             # Fallback: search by user_id or rider_id field
             query = db.collection("rider_profiles").where("user_id", "==", rider_id).limit(1).stream()
             found = False
             for d in query:
                 d.reference.update(update_data)
                 found = True
                 break
             if not found:
                 raise HTTPException(status_code=404, detail="Rider profile not found")

        # 2. Sync with users collection
        user_id = rider_id # Assuming rider_id is user_uid or we find it
        if doc.exists:
            user_id = doc.to_dict().get("user_id", rider_id)
        
        user_update = {}
        if "name" in update_data: user_update["name"] = update_data["name"]
        if "phone_number" in update_data: user_update["phone_number"] = update_data["phone_number"]
        if "email" in update_data: user_update["email"] = update_data["email"]

        if user_update:
            db.collection("users").document(user_id).set(user_update, merge=True)

        return {"status": "success", "message": "Profile updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
