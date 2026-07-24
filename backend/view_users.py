import os
import sys

# Ensure backend modules can be loaded
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.session import SessionLocal, engine
from app.models.user import User

def show_users():
    db = SessionLocal()
    try:
        users = db.query(User).order_by(User.created_at.desc()).all()
        print("\n================================ DATABASE USER RECORDS ================================")
        print(f"Connected Database Engine: {engine.url}")
        print(f"Total Registered Users: {len(users)}\n")
        print(f"{'ID':<38} | {'Name':<20} | {'Email':<30} | {'Provider':<10} | {'Created At'}")
        print("-" * 125)
        for u in users:
            print(f"{str(u.id):<38} | {str(u.name)[:20]:<20} | {str(u.email)[:30]:<30} | {str(u.provider):<10} | {str(u.created_at)}")
        print("========================================================================================\n")
    finally:
        db.close()

if __name__ == "__main__":
    show_users()
