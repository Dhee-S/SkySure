import firebase_admin
from firebase_admin import credentials, firestore
import os

# Firebase Config
SERVICE_ACCOUNT_PATH = os.getenv(
    "FIREBASE_SERVICE_ACCOUNT_PATH", 
    "d:/Code/Guidwire/gigguard/data/guide-wire-22263-firebase-adminsdk-fbsvc-f7755d736a.json"
)

def get_firestore_client():
    if not firebase_admin._apps:
        cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
        firebase_admin.initialize_app(cred)
    return firestore.client()

db = get_firestore_client()
