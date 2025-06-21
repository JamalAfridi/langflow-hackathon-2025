import { NextRequest, NextResponse } from 'next/server';
import { Twilio } from 'twilio';

const accountSid   = process.env.TWILIO_SID;
const authToken    = process.env.TWILIO_TOKEN
const fromPhone    = process.env.TWILIO_NUMBER
const client       = new Twilio(accountSid, authToken);

export async function POST(req: NextRequest) {
  const { to, childName, summary } = await req.json() as {
    to: string;
    childName?: string;
    summary: string;
  };

  // Build the SMS body
  const body = [
    childName ? `Report for ${childName}:` : 'Check-up summary:',
    summary
  ].join('\n\n');

  try {
    const message = await client.messages.create({
      to,        // caregiver’s number (E.164) :contentReference[oaicite:4]{index=4}
      from: fromPhone,  
      body,      // message text :contentReference[oaicite:5]{index=5}
    });
    console.log('SMS sent SID:', message.sid);
    return NextResponse.json({ sent: true, sid: message.sid });
  } catch (err) {
    console.error('Twilio error:', err);
    return NextResponse.json({ 
      error: (err as Error).message || 'Failed to send SMS' 
    }, { status: 500 }); // Use 500 instead of 502
  }
}
