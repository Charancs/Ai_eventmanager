import { NextRequest, NextResponse } from 'next/server';

// Demo data for teacher-specific content
const teacherClasses = [
  {
    id: '1',
    name: 'Data Structures and Algorithms',
    code: 'CS301',
    semester: '5th',
    students: 67,
    schedule: 'Mon, Wed, Fri - 10:00 AM'
  },
  {
    id: '2',
    name: 'Database Management Systems', 
    code: 'CS302',
    semester: '5th',
    students: 72,
    schedule: 'Tue, Thu - 2:00 PM'
  },
  {
    id: '3',
    name: 'Machine Learning Fundamentals',
    code: 'CS401',
    semester: '7th',
    students: 45,
    schedule: 'Mon, Wed - 3:00 PM'
  }
];

const teacherEvents = [
  {
    id: '1',
    title: 'CS301 Mid-term Exam',
    type: 'exam',
    date: new Date('2024-01-25T10:00:00'),
    duration: '3 hours',
    location: 'Lab 301',
    description: 'Mid-semester examination for Data Structures and Algorithms'
  },
  {
    id: '2',
    title: 'Faculty Meeting',
    type: 'meeting',
    date: new Date('2024-01-22T11:00:00'),
    duration: '2 hours',
    location: 'Conference Room A',
    description: 'Monthly department faculty meeting'
  },
  {
    id: '3',
    title: 'ML Workshop Preparation',
    type: 'workshop',
    date: new Date('2024-01-24T14:00:00'),
    duration: '4 hours',
    location: 'CS Lab 2',
    description: 'Prepare materials for upcoming Machine Learning workshop'
  },
  {
    id: '4',
    title: 'Student Project Reviews',
    type: 'review',
    date: new Date('2024-01-26T09:00:00'),
    duration: '5 hours',
    location: 'Faculty Office',
    description: 'Review final year project proposals and provide feedback'
  }
];

const teacherAnnouncements = [
  {
    id: '1',
    title: 'Assignment 3 Deadline Extended',
    content: 'Due to technical difficulties with the submission portal, Assignment 3 deadline has been extended to January 30th.',
    classId: '1',
    className: 'Data Structures and Algorithms',
    priority: 'medium',
    createdAt: new Date('2024-01-16T09:15:00'),
    type: 'class'
  },
  {
    id: '2',
    title: 'Extra Class on Saturday',
    content: 'Additional revision class for DBMS will be conducted this Saturday at 10 AM. Attendance is optional but recommended.',
    classId: '2',
    className: 'Database Management Systems',
    priority: 'low',
    createdAt: new Date('2024-01-15T16:30:00'),
    type: 'class'
  },
  {
    id: '3',
    title: 'ML Lab Session Rescheduled',
    content: 'Wednesday ML lab session has been moved to Thursday 2 PM due to workshop preparations.',
    classId: '3',
    className: 'Machine Learning Fundamentals',
    priority: 'high',
    createdAt: new Date('2024-01-14T11:20:00'),
    type: 'class'
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'classes') {
      return NextResponse.json({
        success: true,
        data: teacherClasses
      });
    }

    if (type === 'events') {
      const upcomingEvents = teacherEvents
        .filter(event => event.date >= new Date())
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      
      return NextResponse.json({
        success: true,
        data: upcomingEvents
      });
    }

    if (type === 'announcements') {
      const sortedAnnouncements = teacherAnnouncements
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      return NextResponse.json({
        success: true,
        data: sortedAnnouncements
      });
    }

    // Return summary data by default
    return NextResponse.json({
      success: true,
      data: {
        classes: teacherClasses,
        upcomingEvents: teacherEvents.filter(event => event.date >= new Date()).slice(0, 3),
        recentAnnouncements: teacherAnnouncements.slice(0, 3),
        stats: {
          totalClasses: teacherClasses.length,
          totalStudents: teacherClasses.reduce((sum, cls) => sum + cls.students, 0),
          upcomingEvents: teacherEvents.filter(event => event.date >= new Date()).length,
          recentAnnouncements: teacherAnnouncements.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching teacher data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch teacher data' },
      { status: 500 }
    );
  }
}
