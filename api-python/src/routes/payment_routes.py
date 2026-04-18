from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from src.middleware.auth import verify_token
from src.firestore_client import db
import uuid
from datetime import datetime

router = APIRouter(dependencies=[Depends(verify_token)])

class PaymentOrder(BaseModel):
    rider_id: str
    amount: float
    currency: str = "INR"
    receipt: str = None

class PaymentVerify(BaseModel):
    order_id: str
    payment_id: str
    signature: str
    rider_id: str

@router.post("/payment/razorpay/order")
async def create_razorpay_order(order: PaymentOrder):
    """Mocks the creation of a Razorpay order"""
    order_id = f"order_{uuid.uuid4().hex[:12]}"
    
    # Store pending order in Firestore
    db.collection("payment_orders").document(order_id).set({
        "order_id": order_id,
        "rider_id": order.rider_id,
        "amount": order.amount,
        "status": "created",
        "created_at": datetime.now().isoformat()
    })
    
    return {
        "id": order_id,
        "amount": order.amount * 100, # Razorpay expects paise
        "currency": "INR",
        "receipt": order.receipt or f"rcpt_{order_id[:8]}"
    }

@router.post("/payment/razorpay/verify")
async def verify_razorpay_payment(verify: PaymentVerify):
    """Mocks the verification of a Razorpay payment and updates policy status"""
    try:
        # Check if order exists
        order_doc = db.collection("payment_orders").document(verify.order_id).get()
        if not order_doc.exists:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Update order status
        db.collection("payment_orders").document(verify.order_id).update({
            "status": "paid",
            "payment_id": verify.payment_id,
            "verified_at": datetime.now().isoformat()
        })
        
        # Update rider policy status in Firestore
        rider_ref = db.collection("rider_profiles").document(verify.rider_id)
        rider_ref.set({
            "is_active": True,
            "kyc_status": "VERIFIED",
            "ring_score": 0,
            "premium_payment_status": "paid",
            "policy_active": True,
            "last_payment_date": datetime.now().isoformat()
        }, merge=True)
        
        return {"status": "success", "message": "Payment verified and policy activated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
