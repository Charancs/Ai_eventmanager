// Simple handler to prevent socket.io 404 errors in development
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Socket.io not implemented in this application',
    status: 'not_available' 
  }, { status: 404 })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Socket.io not implemented in this application',
    status: 'not_available' 
  }, { status: 404 })
}
