import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://python-7pu9.vercel.app/api';
    backendUrl = backendUrl.replace(/\/+$/, '');

    const incomingAuth = req.headers.get('authorization') || '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (incomingAuth) {
      headers['Authorization'] = incomingAuth;
    }

    const res = await fetch(`${backendUrl}/ai/tutor`, {
      method: 'POST',
      headers,
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
