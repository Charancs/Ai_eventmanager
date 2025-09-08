import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return new NextResponse('', { 
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin': '*',
    }
  })
}

export async function POST() {
  return new NextResponse('', { 
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin': '*',
    }
  })
}
