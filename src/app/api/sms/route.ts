import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { to, message, messagingServiceSid } = await request.json()

    if (!to || !message) {
      return NextResponse.json({ error: 'Missing to or message' }, { status: 400 })
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim()
    const authToken = process.env.TWILIO_AUTH_TOKEN?.trim()
    const fromNumber = process.env.TWILIO_FROM_NUMBER?.trim()
    const envMessagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim()

    if (!accountSid || !authToken) {
      return NextResponse.json({ error: 'Missing SMS env vars' }, { status: 500 })
    }

    if (!accountSid.startsWith('AC')) {
      return NextResponse.json({ error: 'Invalid TWILIO_ACCOUNT_SID (must start with AC)' }, { status: 500 })
    }

    // Import here to avoid bundling unless invoked
    const twilio = (await import('twilio')).default
    const client = twilio(accountSid, authToken)

    const params: any = { body: message, to }
    const svcSid = messagingServiceSid?.trim() || envMessagingServiceSid
    if (svcSid) params.messagingServiceSid = svcSid
    else if (fromNumber) params.from = fromNumber
    else return NextResponse.json({ error: 'Missing TWILIO_FROM_NUMBER or TWILIO_MESSAGING_SERVICE_SID' }, { status: 500 })

    const res = await client.messages.create(params)

    return NextResponse.json({ sid: res.sid })
  } catch (err: any) {
    console.error('SMS send error:', err)
    return NextResponse.json({ error: err?.message || 'Failed to send SMS' }, { status: 500 })
  }
}

