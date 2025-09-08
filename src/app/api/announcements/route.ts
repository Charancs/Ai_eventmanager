import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get announcements based on user role and department
    let whereCondition: any = {
      isActive: true
    }

    // Students and Teachers see college-wide and their department announcements
    if (session.user.role === 'STUDENT' || session.user.role === 'TEACHER') {
      whereCondition = {
        ...whereCondition,
        OR: [
          { type: 'COLLEGE' },
          { 
            type: 'DEPARTMENT',
            department: session.user.department
          }
        ]
      }
    }
    // Department admins see their department and college announcements
    else if (session.user.role === 'DEPARTMENT_ADMIN') {
      whereCondition = {
        ...whereCondition,
        OR: [
          { type: 'COLLEGE' },
          { 
            type: 'DEPARTMENT',
            department: session.user.department
          }
        ]
      }
    }
    // Admins see all announcements
    // No additional filtering needed for ADMIN role

    const announcements = await prisma.announcement.findMany({
      where: whereCondition,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    })

    return NextResponse.json(announcements)
  } catch (error) {
    console.error('Announcements API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to create announcements
    if (!['TEACHER', 'DEPARTMENT_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, type, department, priority } = body

    // Validate permissions based on role
    if (session.user.role === 'TEACHER' && type !== 'CLASS') {
      return NextResponse.json({ error: 'Teachers can only create class announcements' }, { status: 403 })
    }

    if (session.user.role === 'DEPARTMENT_ADMIN' && type === 'COLLEGE') {
      return NextResponse.json({ error: 'Department admins cannot create college-wide announcements' }, { status: 403 })
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        type,
        department: type === 'DEPARTMENT' || type === 'CLASS' ? department || session.user.department : null,
        priority: priority || 'MEDIUM',
        createdBy: session.user.id
      }
    })

    return NextResponse.json(announcement)
  } catch (error) {
    console.error('Create announcement error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
