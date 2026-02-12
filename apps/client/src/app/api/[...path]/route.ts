import { NextRequest, NextResponse } from 'next/server';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL;

async function handler(req: NextRequest) {
	if (!SERVER_URL) {
		return NextResponse.json({ error: 'Server URL not configured' }, { status: 500 });
	}

	const path = req.nextUrl.pathname.replace(/^\/api/, '');
	const url = new URL(path, SERVER_URL);
	url.search = req.nextUrl.search;

	const headers = new Headers(req.headers);
	headers.delete('host');

	const res = await fetch(url.toString(), {
		method: req.method,
		headers,
		body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.blob() : undefined,
	});

	const responseHeaders = new Headers(res.headers);

	return new NextResponse(res.body, {
		status: res.status,
		statusText: res.statusText,
		headers: responseHeaders,
	});
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
