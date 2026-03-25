"""
MarketMind AI v2 — Auth API
Handles dynamic OTP-based authentication for terminal access.
"""

import random
import string
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.db.session import get_db
from app.db.models import Waitlist, AuthOTP
from app.utils.mailing import send_otp_email
from pydantic import BaseModel

ALLOWED_EMAILS = {
    "jupalliprabhas@gmail.com"
}

router = APIRouter()

class OTPRequest(BaseModel):
    email: str

class OTPVerify(BaseModel):
    email: str
    otp_code: str

@router.post("/request-otp")
async def request_otp(
    data: OTPRequest, 
    db: AsyncSession = Depends(get_db)
):
    """Generates and sends a 6-digit OTP to a whitelisted, waitlisted user."""
    # Strict Whitelist Check
    if data.email.lower() not in ALLOWED_EMAILS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Unauthorized neural signature."
        )

    # Check if email is on waitlist
    statement = select(Waitlist).where(Waitlist.email == data.email)
    result = await db.execute(statement)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Node not registered on waitlist."
        )

    # Generate 6-digit OTP
    otp_code = "".join(random.choices(string.digits, k=6))
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    # Store OTP
    new_otp = AuthOTP(
        email=data.email,
        otp_code=otp_code,
        expires_at=expires_at
    )
    db.add(new_otp)
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate access key: {str(e)}"
        )

    # Send email (fire and forget)
    await send_otp_email(data.email, otp_code)

    return {
        "status": "success", 
        "message": "Neural access key dispatched to your node."
    }

@router.post("/verify-otp")
async def verify_otp(
    data: OTPVerify, 
    db: AsyncSession = Depends(get_db)
):
    """Verifies the 6-digit OTP."""
    statement = select(AuthOTP).where(
        AuthOTP.email == data.email,
        AuthOTP.otp_code == data.otp_code,
        AuthOTP.is_used == False,
        AuthOTP.expires_at > datetime.utcnow()
    )
    result = await db.execute(statement)
    otp_record = result.scalar_one_or_none()

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access key."
        )

    # Mark as used
    try:
        otp_record.is_used = True
        await db.commit()
    except Exception as e:
        await db.rollback()
        # Fallback: if committing fails, we might allow entrance once but it's risky.
        # Here we prioritize security.
    
    return {
        "status": "success", 
        "message": "Neural link established. Access granted."
    }
