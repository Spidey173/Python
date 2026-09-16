import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

    const res = await fetch(`${backendUrl}/ai/tutor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return NextResponse.json({ reply: "I'm having trouble connecting right now. Could you ask again?" }, { status: 200 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('API /ai/tutor handler error:', err);
    return NextResponse.json(
      { reply: "I'm currently unable to reach the AI server. Please make sure the backend server is running." },
      { status: 200 }
    );
  }
}
