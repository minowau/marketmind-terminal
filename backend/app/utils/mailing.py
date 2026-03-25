import httpx
from app.config import settings
from app.utils.logging import get_logger

logger = get_logger("mailing")

async def _send_via_brevo(to: str, subject: str, html_content: str, text_content: str = ""):
    """Internal helper to send email via Brevo v3 HTTP API."""
    if not settings.BREVO_API_KEY:
        # Fallback logic for transition/legacy support
        if settings.SENDGRID_API_KEY:
            return await _send_via_sendgrid(to, subject, html_content, text_content)
        elif settings.RESEND_API_KEY:
            return await _send_via_resend(to, subject, text_content or html_content)
        logger.warning("mailing_skipped_no_api_key", email=to)
        return False

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.brevo.com/v3/smtp/email",
                headers={
                    "api-key": settings.BREVO_API_KEY,
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                json={
                    "sender": {"name": "The Council", "email": "onboarding@thecouncil.ai"},
                    "to": [{"email": to}],
                    "subject": subject,
                    "htmlContent": html_content,
                    "textContent": text_content or "Please use an HTML enabled client to view this message."
                },
                timeout=15.0,
            )
            
            if response.status_code in (200, 201, 202):
                logger.info("mailing_success_brevo", email=to)
                return True
            else:
                logger.error("mailing_failed_brevo", status=response.status_code, error=response.text, email=to)
                return False

    except Exception as e:
        logger.error("mailing_exception_brevo", error=str(e), email=to)
        return False

async def _send_via_sendgrid(to: str, subject: str, html_content: str, text_content: str = ""):
    """SendGrid v3 API helper."""
    if not settings.SENDGRID_API_KEY:
        return False
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                "https://api.sendgrid.com/v3/mail/send",
                headers={"Authorization": f"Bearer {settings.SENDGRID_API_KEY}", "Content-Type": "application/json"},
                json={
                    "personalizations": [{"to": [{"email": to}]}],
                    "from": {"email": "onboarding@thecouncil.ai", "name": "The Council"},
                    "subject": subject,
                    "content": [{"type": "text/plain", "value": text_content}, {"type": "text/html", "value": html_content}]
                },
                timeout=15.0
            )
            return True
    except Exception:
        return False

async def _send_via_resend(to: str, subject: str, body: str):
    """Fallback helper for Resend HTTP API."""
    if not settings.RESEND_API_KEY:
        return False
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}", "Content-Type": "application/json"},
                json={"from": "The Council <onboarding@resend.dev>", "to": to, "subject": subject, "text": body},
                timeout=15.0
            )
            return True
    except Exception:
        return False

def _get_base_template(content_html: str):
    """Returns the sleek dark-themed HTML wrapper for The Council emails."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ background-color: #000000; color: #ffffff; font-family: 'Inter', -apple-system, blinkmacsystemfont, 'Segoe UI', roboto, sans-serif; margin: 0; padding: 0; }}
            .container {{ max-width: 600px; margin: 40px auto; background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }}
            .header {{ padding: 40px; text-align: center; border-bottom: 1px solid #1a1a1a; background: linear-gradient(to bottom, #111, #0a0a0a); }}
            .logo {{ font-size: 10px; font-weight: 900; letter-spacing: 0.5em; text-transform: uppercase; color: #ffffff; }}
            .logo span {{ color: #3b82f6; font-style: italic; opacity: 0.6; }}
            .content {{ padding: 40px; line-height: 1.6; color: #a1a1aa; font-size: 14px; }}
            .footer {{ padding: 30px; text-align: center; font-size: 10px; color: #3f3f46; letter-spacing: 0.1em; border-top: 1px solid #1a1a1a; text-transform: uppercase; }}
            h1 {{ color: #ffffff; font-size: 24px; font-weight: 900; margin-bottom: 24px; letter-spacing: -0.02em; text-transform: uppercase; }}
            .highlight {{ color: #3b82f6; }}
            .status-box {{ background: #111; border: 1px solid #1a1a1a; padding: 20px; border-radius: 12px; margin: 30px 0; }}
            .status-label {{ font-size: 10px; font-weight: 900; color: #3b82f6; opacity: 0.6; margin-bottom: 4px; display: block; }}
            .status-value {{ color: #ffffff; font-weight: 700; font-size: 16px; }}
            .btn {{ display: inline-block; background: #3b82f6; color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 900; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; margin-top: 20px; box-shadow: 0 10px 20px rgba(59, 130, 246, 0.2); }}
            .otp-code {{ font-size: 48px; font-weight: 900; color: #3b82f6; letter-spacing: 8px; margin: 20px 0; text-align: center; font-family: monospace; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">The <span>Council</span></div>
            </div>
            <div class="content">
                {content_html}
            </div>
            <div class="footer">
                Neural Protocol v2.0 &bull; Secure Transmission &bull; 2026
            </div>
        </div>
    </body>
    </html>
    """

async def send_waitlist_confirmation(recipient_email: str, recipient_name: str, reg_number: int):
    """Sends a premium HTML waitlist confirmation email."""
    first_name = recipient_name.strip().split(" ")[0].capitalize()
    tier = "Alpha Access" if reg_number <= 100 else "Priority Access" if reg_number <= 500 else "Early Access"
    
    html = _get_base_template(f"""
        <h1>Registry Initialized.</h1>
        <p>Hi {first_name}, you have been successfully indexed by the neural core.</p>
        <p>The Council is simulating the future of finance with <span class="highlight">30 high-fidelity neural agents</span>. We don't just track markets; we model the psychological inevitability of every trade.</p>
        
        <div class="status-box">
            <span class="status-label">Protocol Tier</span>
            <span class="status-value">{tier}</span>
            <div style="height: 12px;"></div>
            <span class="status-label">Neural Signature</span>
            <span class="status-value">Node #{reg_number:06d}</span>
        </div>
        
        <p>You will be notified as soon as your neural link is ready for synchronization.</p>
        <a href="https://minowau-marketmind-terminal.hf.space" class="btn">Explore The Grid</a>
    """)
    
    text = f"You're in, {first_name}. Your position is #{reg_number}. The Council is watching."
    return await _send_via_brevo(recipient_email, f"You're in. [Registry: #{reg_number:06d}] — The Council", html, text)

async def send_otp_email(recipient_email: str, otp_code: str):
    """Sends a premium HTML OTP email for terminal access."""
    html = _get_base_template(f"""
        <h1 style="color: #ef4444;">Access Protocol Required.</h1>
        <p>A temporary neural authorization has been requested for this node. Enter the key below at the Protocol Gate to establish your link.</p>
        
        <div class="otp-code">{otp_code}</div>
        
        <p style="font-size: 11px; opacity: 0.6; text-align: center;">EXPIRATION: 10 MINUTES &bull; ONE-TIME USE ONLY</p>
        
        <div class="status-box" style="border-color: #ef444433;">
            <p style="font-size: 12px; margin: 0;"><strong>SECURITY_NOTICE:</strong> Do not share this key. Verified signatures only. If you did not request this, your node remains secure.</p>
        </div>
    """)
    
    text = f"Your Secure Access Key: {otp_code}. Expires in 10 minutes."
    return await _send_via_brevo(recipient_email, f"CRITICAL_ACCESS_KEY: [{otp_code}] — The Council", html, text)
