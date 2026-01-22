import { NextResponse } from 'next/server'

export async function GET() {
  const sid = process.env.TWILIO_ACCOUNT_SID || ''
  const token = process.env.TWILIO_AUTH_TOKEN || ''
  const from = process.env.TWILIO_FROM_NUMBER || ''
  const svc = process.env.TWILIO_MESSAGING_SERVICE_SID || ''

  return NextResponse.json({
    sidPrefix: sid.slice(0, 2),
    sidMasked: sid ? sid.slice(0, 4) + '...' + sid.slice(-4) : null,
    tokenPresent: token.length > 8,
    fromPresent: !!from,
    svcPresent: !!svc,
    using: svc ? 'messagingServiceSid' : from ? 'fromNumber' : 'none'
  })
}

