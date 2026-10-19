import nodemailer from 'nodemailer';
import { resolve4 } from 'node:dns/promises';
import { isIP } from 'node:net';

export const sendResetEmail = async (toEmail: string, userName: string, resetUrl: string): Promise<void> => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const googleRefreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const gmailFrom = process.env.GMAIL_FROM || process.env.SMTP_USER;
  const resendApiKey = process.env.RESEND_API_KEY;
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || 'noreply@yadavhealth.com';
  const mailOptions = {
    from: `"Yadav Health Diagnostics" <${from}>`,
    to: toEmail,
    subject: 'Secure Password Reset Request - Yadav Health Diagnostics',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8fafc;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 16px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            overflow: hidden;
            border: 1px solid #e2e8f0;
          }
          .header {
            background-color: #0f172a;
            padding: 32px;
            text-align: center;
          }
          .header h1 {
            color: #10b981;
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.5px;
          }
          .content {
            padding: 40px 32px;
            color: #334155;
            line-height: 1.6;
          }
          .content h2 {
            margin-top: 0;
            color: #0f172a;
            font-size: 20px;
            font-weight: 600;
          }
          .btn-container {
            text-align: center;
            margin: 32px 0;
          }
          .btn {
            background-color: #10b981;
            color: #ffffff !important;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 15px;
            display: inline-block;
            box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);
          }
          .btn:hover {
            background-color: #059669;
          }
          .footer {
            background-color: #f1f5f9;
            padding: 24px 32px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
          }
          .link-box {
            background-color: #f8fafc;
            border: 1px dashed #cbd5e1;
            padding: 12px;
            font-family: monospace;
            word-break: break-all;
            font-size: 12px;
            border-radius: 6px;
            margin-top: 24px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Yadav Health Diagnostics</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName},</h2>
            <p>We received a request to reset the password associated with your Yadav Health Patient account. To set up a new password, click the button below:</p>
            <div class="btn-container">
              <a href="${resetUrl}" class="btn" target="_blank">Reset Your Password</a>
            </div>
            <p><strong>This password reset link is valid for 1 hour only.</strong> After that, you will have to make another request.</p>
            <p>If you did not make this request, you can safely ignore this email. Your current password remains perfectly secure and will not change.</p>
            
            <div class="link-box">
              If the button doesn't work, copy and paste this URL into your browser:<br>
              <a href="${resetUrl}" style="color: #10b981;">${resetUrl}</a>
            </div>
          </div>
          <div class="footer">
            &copy; 2026 Yadav Health Diagnostics. All rights reserved.<br>
            Please do not reply directly to this automated email message.
          </div>
        </div>
      </body>
      </html>
    `,
  };

  const hasAnyGoogleOAuthSetting = Boolean(googleClientId || googleClientSecret || googleRefreshToken);
  if (hasAnyGoogleOAuthSetting) {
    if (!googleClientId || !googleClientSecret || !googleRefreshToken || !gmailFrom) {
      throw new Error('Gmail API mail is only partially configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, and GMAIL_FROM.');
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: googleClientId,
        client_secret: googleClientSecret,
        refresh_token: googleRefreshToken,
        grant_type: 'refresh_token',
      }),
      signal: AbortSignal.timeout(10000),
    });
    const tokenBody = await tokenResponse.json() as { access_token?: string; error_description?: string; error?: string };
    if (!tokenResponse.ok || !tokenBody.access_token) {
      throw new Error(`Google OAuth token refresh failed: ${tokenBody.error_description || tokenBody.error || tokenResponse.statusText}`);
    }

    const subject = `=?UTF-8?B?${Buffer.from(mailOptions.subject, 'utf8').toString('base64')}?=`;
    const mimeMessage = [
      `From: Yadav Health Diagnostics <${gmailFrom}>`,
      `To: ${toEmail}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(mailOptions.html, 'utf8').toString('base64'),
    ].join('\r\n');
    const raw = Buffer.from(mimeMessage, 'utf8').toString('base64url');

    const sendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenBody.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
      signal: AbortSignal.timeout(10000),
    });
    if (!sendResponse.ok) {
      const errorBody = await sendResponse.text();
      throw new Error(`Gmail API rejected the message (${sendResponse.status}): ${errorBody.slice(0, 500)}`);
    }
    return;
  }

  // Render's free web services block SMTP ports. Resend's HTTPS API uses port
  // 443, so it works there without opening SMTP egress.
  if (resendApiKey) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: mailOptions.from,
        to: [toEmail],
        subject: mailOptions.subject,
        html: mailOptions.html,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Email API rejected the message (${response.status}): ${errorBody.slice(0, 500)}`);
    }
    return;
  }

  if (!host || !user || !pass) {
    throw new Error('Email is not configured. Set RESEND_API_KEY, or configure SMTP_HOST, SMTP_USER, and SMTP_PASS.');
  }

  // Some hosts publish AAAA records without providing a usable IPv6 route.
  // Resolve SMTP to IPv4 explicitly while preserving TLS hostname validation.
  let connectHost = host;
  if (isIP(host) !== 4) {
    const ipv4Addresses = await resolve4(host);
    if (ipv4Addresses.length === 0) {
      throw new Error(`SMTP host ${host} did not resolve to an IPv4 address.`);
    }
    connectHost = ipv4Addresses[0];
  }

  const transporter = nodemailer.createTransport({
    host: connectHost,
    port,
    secure: port === 465,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    auth: { user, pass },
    tls: { servername: host },
  });

  await transporter.sendMail(mailOptions);
};
