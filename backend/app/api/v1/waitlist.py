"""
MarketMind AI v2 — Waitlist API
Handles user signups for the terminal waitlist.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.db.session import get_db
from app.db.models import Waitlist
from app.utils.mailing import send_waitlist_confirmation
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class WaitlistCreate(BaseModel):
    name: str
    email: str

@router.post("/", status_code=status.HTTP_201_CREATED)
async def join_waitlist(
    data: WaitlistCreate,
    db: AsyncSession = Depends(get_db)
):
    """Adds a user to the waitlist and sends a confirmation email."""
    
    # Check if already exists
    statement = select(Waitlist).where(Waitlist.email == data.email)
    result = await db.execute(statement)
    existing = result.first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered on waitlist."
        )

    try:
        # Create record
        new_entry = Waitlist(
            name=data.name,
            email=data.email,
            created_at=datetime.utcnow()
        )
        db.add(new_entry)
        await db.commit()
        await db.refresh(new_entry)

        # Send email (fire and forget for now, but we'll log result)
        await send_waitlist_confirmation(data.email, data.name, new_entry.id)

        return {
            "status": "success",
            "message": "Protocol initialized. Confirmation email dispatched.",
            "data": {
                "id": new_entry.id,
                "email": new_entry.email
            }
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to join waitlist: {str(e)}"
        )

@router.get("/")
async def get_waitlist_entries(
    db: AsyncSession = Depends(get_db)
):
    """Returns masked users on the waitlist (Encrypted neural signatures)."""
    try:
        statement = select(Waitlist).order_by(Waitlist.created_at.desc())
        result = await db.execute(statement)
        entries = result.scalars().all()
        
        # Masking logic for PII protection (Encryption)
        masked_entries = []
        for entry in entries:
            # Mask email: jup...s@gmail.com
            email_parts = entry.email.split("@")
            if len(email_parts) == 2:
                user_part = email_parts[0]
                domain_part = email_parts[1]
                masked_email = f"{user_part[:3]}...{user_part[-1:]}@{domain_part}" if len(user_part) > 4 else f"{user_part[0]}...@{domain_part}"
            else:
                masked_email = "***@***.***"
                
            # Mask name: Ju...s
            masked_name = f"{entry.name[:2]}...{entry.name[-1:]}" if len(entry.name) > 3 else "***"
            
            masked_entries.append({
                "id": entry.id,
                "name": masked_name,
                "email": masked_email,
                "created_at": entry.created_at
            })
            
        return {"status": "success", "data": masked_entries}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch encrypted neural signatures: {str(e)}"
        )

@router.get("/count")
async def get_waitlist_count(
    db: AsyncSession = Depends(get_db)
):
    """Returns the total number of users on the waitlist."""
    try:
        result = await db.execute(select(func.count(Waitlist.id)))
        count = result.scalar()
        return {"count": count or 0}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch waitlist count: {str(e)}"
        )
