import nodemailer from 'nodemailer';

export const sendResetEmail = async (toEmail: string, userName: string, resetUrl: string): Promise<void> => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || 'noreply@yadavhealth.com';

  if (!host || !user || !pass) {
    throw new Error('SMTP credentials are not fully configured in your environment variables. Please check SMTP_HOST, SMTP_USER, and SMTP_PASS settings.');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

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

  await transporter.sendMail(mailOptions);
};
