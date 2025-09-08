import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { message, conversationHistory, userRole, userId } = body

    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        userId: session.user.id,
        title: null // Active conversation
      }
    })

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId: session.user.id,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : '')
        }
      })
    }

    // Save user message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        content: message,
        role: 'USER'
      }
    })

    // Process message based on user role and intent
    const response = await processMessage(message, userRole, session.user)

    // Save assistant response
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        content: response,
        role: 'ASSISTANT'
      }
    })

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function processMessage(message: string, userRole: string, user: any): Promise<string> {
  const messageLower = message.toLowerCase()

  // Intent detection for different user roles
  if (messageLower.includes('announcement') || messageLower.includes('notice')) {
    return handleAnnouncementQuery(messageLower, userRole, user)
  }

  if (messageLower.includes('reminder') || messageLower.includes('deadline') || messageLower.includes('exam') || messageLower.includes('assignment')) {
    return handleReminderQuery(messageLower, userRole, user)
  }

  if (messageLower.includes('event') || messageLower.includes('schedule')) {
    return handleEventQuery(messageLower, userRole, user)
  }

  if (messageLower.includes('help') || messageLower.includes('what can you do')) {
    return getHelpMessage(userRole)
  }

  // Default response based on role
  return getDefaultResponse(userRole, user)
}

function handleAnnouncementQuery(message: string, userRole: string, user: any): string {
  switch (userRole) {
    case 'STUDENT':
      return `I can help you stay updated with announcements! Here's what I can do:
      
📢 Show recent college announcements
📋 Display department-specific notices for ${user.department}
🔔 Set up announcement notifications
📅 Filter announcements by date or priority

What specific announcements would you like to see?`

    case 'TEACHER':
      return `I can assist you with class announcements! Here are your options:

📝 Create a new class announcement
📢 View your recent announcements
👥 Send announcements to specific classes
📊 Check announcement engagement
🔄 Edit or update existing announcements

Would you like to create a new announcement or manage existing ones?`

    case 'DEPARTMENT_ADMIN':
      return `I can help you manage department announcements! Available actions:

🏢 Create department-wide announcements
📋 View all department announcements
👥 Target announcements to specific years or groups
📊 Track announcement reach and engagement
🔄 Manage and moderate announcements

What type of department announcement would you like to create or manage?`

    case 'ADMIN':
      return `I can help you with college-wide announcements! Here's what I can do:

🎓 Create college-wide announcements
🏢 Manage department announcements
📊 View announcement analytics across all departments
🚨 Send urgent/emergency notifications
👥 Manage announcement permissions

Would you like to create a college-wide announcement or manage existing ones?`

    default:
      return "I can help you with announcements. What would you like to know?"
  }
}

function handleReminderQuery(message: string, userRole: string, user: any): string {
  switch (userRole) {
    case 'STUDENT':
      return `I'll help you manage your academic reminders! I can:

📚 Set exam reminders
📝 Track assignment deadlines
🎯 Create project milestones
📅 Personal event reminders
🔔 Send notifications before deadlines

Just tell me what you'd like to be reminded about and when! For example:
"Remind me about my Math exam on March 15th"
"Set a deadline reminder for my CS project due next Friday"`

    case 'TEACHER':
      return `I can help you manage important dates and deadlines! Available features:

📅 Set exam schedules and reminders
📝 Track assignment due dates
👥 Create class event reminders
📊 Grade submission deadlines
🔔 Get notified about important dates

What would you like to set a reminder for?`

    case 'DEPARTMENT_ADMIN':
    case 'ADMIN':
      return `I can help you track important administrative dates:

📅 Faculty meeting reminders
📊 Report submission deadlines
🎓 Academic calendar events
📋 Administrative task reminders
🔔 System maintenance schedules

What administrative reminder would you like to set?`

    default:
      return "I can help you set up reminders. What would you like to be reminded about?"
  }
}

function handleEventQuery(message: string, userRole: string, user: any): string {
  switch (userRole) {
    case 'STUDENT':
      return `Here are the upcoming events relevant to you:

🎓 College Events:
• Tech Fest 2025 - March 20-22
• Annual Sports Day - April 15
• Cultural Night - April 30

🏢 ${user.department} Department Events:
• Department Seminar - March 10
• Industry Visit - March 25
• Project Exhibition - April 5

📅 Year ${user.year} Specific:
• Career Guidance Session - March 12
• Placement Drive - April 20

Would you like more details about any specific event?`

    case 'TEACHER':
      return `Here are upcoming events you might be interested in:

🏫 Faculty Events:
• Faculty Development Program - March 8-10
• Department Meeting - March 15
• Academic Review - March 28

👥 Student Events:
• Parent-Teacher Meeting - March 18
• Annual Function - April 25

📚 Academic Events:
• Semester Exams - April 1-15
• Result Declaration - May 1

Would you like to schedule a new event or get more details about existing ones?`

    case 'DEPARTMENT_ADMIN':
      return `Department events overview:

📊 Administrative:
• Department Review Meeting - March 12
• Budget Planning Session - March 20
• Faculty Appraisal - April 1

🎓 Academic:
• Department Seminar Series - Ongoing
• Industrial Collaboration Meet - March 25
• Alumni Networking Event - April 10

Would you like to create a new department event or manage existing ones?`

    case 'ADMIN':
      return `College-wide events overview:

🎓 Academic Calendar:
• Mid-semester Exams - March 1-15
• Summer Break - May 15 - June 15
• New Academic Year - July 1

🏛️ Administrative:
• Board Meeting - March 30
• Annual General Meeting - April 15
• Accreditation Review - May 1

🎉 Cultural:
• Annual Festival - April 20-22
• Graduation Ceremony - May 30

Would you like to schedule a new event or modify existing ones?`

    default:
      return "I can help you with event information. What would you like to know?"
  }
}

function getHelpMessage(userRole: string): string {
  const baseFeatures = `
🗨️ Text, voice, and image messaging
💾 Remember our conversation history
🔔 Smart notifications and reminders`

  switch (userRole) {
    case 'STUDENT':
      return `I'm your AI assistant! Here's how I can help you:

📚 Academic Support:
• Track exam dates and assignments
• Set project deadlines and reminders
• Get study tips and resources

📢 Stay Informed:
• College and department announcements
• Event notifications
• Important deadline alerts

🎯 Personal Organization:
• Custom reminders for important dates
• Academic calendar management
• Goal tracking

${baseFeatures}

Just ask me naturally! Try "When is my next exam?" or "Set a reminder for my project deadline"`

    case 'TEACHER':
      return `I'm here to assist you with teaching and administrative tasks!

👥 Class Management:
• Create announcements for your classes
• Set exam and assignment schedules
• Track important academic dates

📊 Administrative:
• Manage grade submission deadlines
• Faculty meeting reminders
• Department coordination

🔄 Communication:
• Broadcast messages to students
• Coordinate with other faculty
• Parent-teacher meeting schedules

${baseFeatures}

Ask me things like "Create an announcement for my CS101 class" or "Remind me about the faculty meeting"`

    case 'DEPARTMENT_ADMIN':
      return `I'll help you manage department operations efficiently!

🏢 Department Management:
• Create department-wide announcements
• Schedule departmental events
• Coordinate faculty activities

👥 Communication:
• Send notices to all department students
• Coordinate between faculty and students
• Manage department calendar

📊 Administration:
• Track department metrics
• Schedule meetings and reviews
• Manage administrative deadlines

${baseFeatures}

Try asking "Send an announcement to all CS students" or "Schedule a department meeting"`

    case 'ADMIN':
      return `I'm your comprehensive college administration assistant!

🎓 College-wide Management:
• Create institution-wide announcements
• Manage academic calendar
• Oversee all departments

👥 User Management:
• Monitor system usage
• Manage user permissions
• Coordinate across departments

📊 Analytics & Reports:
• System performance monitoring
• Usage analytics
• Administrative oversight

${baseFeatures}

Ask me to "Create a college-wide announcement" or "Show system analytics"`

    default:
      return `I'm your AI assistant. I can help with announcements, reminders, events, and more!${baseFeatures}`
  }
}

function getDefaultResponse(userRole: string, user: any): string {
  const responses = {
    STUDENT: `Hello ${user.name}! I'm here to help you with your studies and college life. You can ask me about:
    
• Upcoming announcements and events
• Setting reminders for exams and assignments
• Department news and updates
• Academic deadlines and important dates

What would you like to know or do today?`,

    TEACHER: `Hello Professor ${user.name}! I can assist you with:

• Creating class announcements
• Managing academic schedules
• Setting up reminders for important dates
• Coordinating with students and colleagues

How can I help you today?`,

    DEPARTMENT_ADMIN: `Hello ${user.name}! As a department administrator, I can help you with:

• Department-wide communications
• Event scheduling and management
• Faculty coordination
• Student affairs

What administrative task can I assist you with?`,

    ADMIN: `Welcome ${user.name}! As a system administrator, I can help you with:

• College-wide announcements and policies
• System management and oversight
• Inter-department coordination
• Analytics and reporting

What would you like to manage today?`
  }

  return responses[userRole as keyof typeof responses] || "Hello! How can I assist you today?"
}
