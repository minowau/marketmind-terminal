import httpx
from app.config import settings
from app.utils.logging import get_logger

logger = get_logger("mailing")

async def _send_via_resend(to: str, subject: str, body: str):
    """Internal helper to send email via Resend HTTP API."""
    if not settings.RESEND_API_KEY:
        logger.warning("mailing_skipped_no_api_key", email=to)
        return False

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": "MarketMind AI <onboarding@resend.dev>",
                    "to": to,
                    "subject": subject,
                    "text": body,
                },
                timeout=15.0,
            )
            
            if response.status_code in (200, 201, 202):
                logger.info("mailing_success_resend", email=to)
                return True
            else:
                logger.error("mailing_failed_resend", status=response.status_code, error=response.text, email=to)
                return False

    except Exception as e:
        logger.error("mailing_exception_resend", error=str(e), email=to)
        return False

async def send_waitlist_confirmation(recipient_email: str, recipient_name: str, reg_number: int):
    """
    Sends a punchy, high-conversion thank you email to a user who just joined the waitlist.
    Includes dynamic First Name and Waitlist Tier.
    """
    # Extract first name
    first_name = recipient_name.strip().split(" ")[0].capitalize()
    
    # Determine tier
    if reg_number <= 100:
        tier = "Alpha Access"
    elif reg_number <= 500:
        tier = "Priority Access"
    else:
        tier = "Early Access"

    subject = f"You're in. [Registry: #{reg_number:06d}] — MarketMind AI"
    body = f"""Hi {first_name},

You’re in.

MarketMind AI is building something different:

We don’t just analyze markets.
We simulate them.

You’ll soon be able to:
• See how investors react to news
• Detect signals before they move
• Predict market behavior

Your current status:
{tier} (Position #{reg_number})

We’ll notify you as soon as your access unlocks.

Until then — stay ready.

— MarketMind AI
"""
    return await _send_via_resend(recipient_email, subject, body)

async def send_otp_email(recipient_email: str, otp_code: str):
    """
    Sends a time-limited OTP code for terminal access.
    """
    subject = f"CRITICAL_ACCESS_KEY: [{otp_code}] — MarketMind AI"
    body = f"""
NEURAL_GATE_AUTHORIZATION_REQUIRED

A temporary access protocol has been initialized for this identity.

--------------------------------------------------
YOUR SECURE OTP: {otp_code}
EXPIRES_IN: 10 MINUTES
--------------------------------------------------

SECURITY_NOTICE: DO NOT SHARE THIS KEY. This code identifies your neural signature for this session only. Use it at at the Terminal Protocol Gate to authorize your entry.

If you did not request this authorization, ignore this transmission. Your node remains secure.

Explore the future of finance.
— The MarketMind Core
    """
    return await _send_via_resend(recipient_email, subject, body)
