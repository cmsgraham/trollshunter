"""Make a user admin by username or user ID."""
import sys
from database import SessionLocal
from models import User

def make_admin(identifier: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(
            (User.username == identifier) | (User.x_username == identifier)
        ).first()
        if not user:
            try:
                user = db.query(User).filter(User.id == int(identifier)).first()
            except ValueError:
                pass
        if not user:
            print(f"User '{identifier}' not found")
            return
        user.is_admin = True
        db.commit()
        print(f"✓ {user.display_name or user.username or user.x_username} (id={user.id}) is now admin")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python make_admin.py <username_or_id>")
        sys.exit(1)
    make_admin(sys.argv[1])
