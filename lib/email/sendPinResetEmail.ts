import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://story-bloom.shredstack.net'
  : 'http://localhost:3000'

interface SendPinResetEmailParams {
  to: string
  resetToken: string
}

export async function sendPinResetEmail({ to, resetToken }: SendPinResetEmailParams) {
  const resetUrl = `${BASE_URL}/reset-pin?token=${resetToken}`

  const { data, error } = await resend.emails.send({
    from: 'StoryBloom <storybloom@shredstack.net>',
    replyTo: 'shredstacksarah@gmail.com',
    to,
    subject: 'Reset Your Parent PIN - StoryBloom',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Parent PIN</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #8b5cf6, #ec4899); margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 30px;">📚</span>
            </div>
            <h1 style="color: #8b5cf6; margin: 0; font-size: 24px;">StoryBloom</h1>
          </div>

          <div style="background: #f9fafb; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 15px; color: #1f2937; font-size: 20px;">Reset Your Parent PIN</h2>
            <p style="margin: 0 0 20px; color: #4b5563;">
              We received a request to reset your Parent PIN for StoryBloom. Click the button below to set a new PIN.
            </p>
            <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #ec4899); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Reset PIN
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">
            This link will expire in 1 hour. If you didn't request this reset, you can safely ignore this email.
          </p>

          <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #8b5cf6; word-break: break-all;">${resetUrl}</a>
          </p>
        </body>
      </html>
    `,
    text: `Reset Your Parent PIN

We received a request to reset your Parent PIN for StoryBloom.

Click this link to set a new PIN: ${resetUrl}

This link will expire in 1 hour. If you didn't request this reset, you can safely ignore this email.
`,
  })

  if (error) {
    console.error('Error sending PIN reset email:', error)
    throw new Error('Failed to send reset email')
  }

  return data
}
