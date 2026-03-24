import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings
from app.utils.logging import get_logger

logger = get_logger("mailing")

async def send_waitlist_confirmation(recipient_email: str, recipient_name: str, reg_number: int):
    """
    Sends a punchy, high-conversion thank you email to a user who just joined the waitlist.
    Includes dynamic First Name and Waitlist Tier.
    """
    if not settings.SMTP_PASSWORD:
        logger.warning("mailing_skipped_no_password", email=recipient_email)
        return False

    try:
        # Extract first name
        first_name = recipient_name.strip().split(" ")[0].capitalize()
        
        # Determine tier
        if reg_number <= 100:
            tier = "Alpha Access"
        elif reg_number <= 500:
            tier = "Priority Access"
        else:
            tier = "Early Access"

        # Create message
        msg = MIMEMultipart()
        msg["From"] = settings.SMTP_USER
        msg["To"] = recipient_email
        msg["Subject"] = f"You're in. [Registry: #{reg_number:06d}] — MarketMind AI"

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
        msg.attach(MIMEText(body, "plain"))

        # Connect and send asynchronously
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            use_tls=(settings.SMTP_PORT == 465),
            start_tls=(settings.SMTP_PORT == 587),
            timeout=15,
        )
        
        logger.info("mailing_success", email=recipient_email, reg_number=reg_number, tier=tier)
        return True

    except Exception as e:
        logger.error("mailing_failed", error=str(e), email=recipient_email)
        return False

async def send_otp_email(recipient_email: str, otp_code: str):
    """
    Sends a time-limited OTP code for terminal access.
    """
    if not settings.SMTP_PASSWORD:
        logger.warning("mailing_skipped_no_password", email=recipient_email)
        return False

    try:
        # Create message
        msg = MIMEMultipart()
        msg["From"] = settings.SMTP_USER
        msg["To"] = recipient_email
        msg["Subject"] = f"CRITICAL_ACCESS_KEY: [{otp_code}] — MarketMind AI"

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
        msg.attach(MIMEText(body, "plain"))

        # Connect and send asynchronously
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            use_tls=(settings.SMTP_PORT == 465),
            start_tls=(settings.SMTP_PORT == 587),
            timeout=15,
        )
        
        logger.info("mailing_otp_success", email=recipient_email)
        return True

    except Exception as e:
        logger.error("mailing_otp_failed", error=str(e), email=recipient_email)
        return False
