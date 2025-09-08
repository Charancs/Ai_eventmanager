import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Block all socket.io requests with a 200 response to stop retries
  if (pathname.startsWith('/socket.io')) {
    return new NextResponse('', { 
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/socket.io/:path*',
  ],
}
