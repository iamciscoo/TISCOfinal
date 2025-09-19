interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

interface EmailResult {
  success: boolean
  error?: string
  messageId?: string
}

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    const { to, subject, html, from = process.env.SMTP_FROM_EMAIL || 'noreply@tisco.co.tz' } = options

    // Validate required environment variables
    const requiredEnvVars = {
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASS: process.env.SMTP_PASS,
    }

    const missingVars = Object.entries(requiredEnvVars)
      .filter(([, value]) => !value)
      .map(([key]) => key)

    if (missingVars.length > 0) {
      return {
        success: false,
        error: `Missing required environment variables: ${missingVars.join(', ')}`
      }
    }

    // Use nodemailer for SMTP email sending
    const nodemailer = await import('nodemailer')
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT!),
      secure: process.env.SMTP_SECURE === 'true' || parseInt(process.env.SMTP_PORT!) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    })

    return {
      success: true,
      messageId: info.messageId
    }

  } catch (error) {
    console.error('SendPulse email error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email sending error'
    }
  }
}

// Alternative implementation using SendPulse API if preferred
export async function sendEmailViaSendPulse(options: EmailOptions): Promise<EmailResult> {
  try {
    const { to, subject, html, from = process.env.SENDPULSE_FROM_EMAIL || 'noreply@tisco.co.tz' } = options

    const apiUserId = process.env.SENDPULSE_API_USER_ID
    const apiSecret = process.env.SENDPULSE_API_SECRET

    if (!apiUserId || !apiSecret) {
      return {
        success: false,
        error: 'Missing SendPulse API credentials (SENDPULSE_API_USER_ID, SENDPULSE_API_SECRET)'
      }
    }

    // Get access token
    const tokenResponse = await fetch('https://api.sendpulse.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: apiUserId,
        client_secret: apiSecret,
      }),
    })

    if (!tokenResponse.ok) {
      return {
        success: false,
        error: 'Failed to authenticate with SendPulse API'
      }
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Send email
    const emailResponse = await fetch('https://api.sendpulse.com/smtp/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: {
          from: { name: 'TISCO', email: from },
          to: [{ email: to }],
          subject,
          html,
        },
      }),
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json()
      return {
        success: false,
        error: errorData.message || 'Failed to send email via SendPulse'
      }
    }

    const result = await emailResponse.json()
    
    return {
      success: true,
      messageId: result.id
    }

  } catch (error) {
    console.error('SendPulse API error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown SendPulse error'
    }
  }
}
