import { NextRequest, NextResponse } from 'next/server';

// Demo data for department-specific content
const departmentStats = {
  'Computer Science': {
    totalStudents: 1247,
    totalTeachers: 89,
    activeAnnouncements: 8,
    upcomingEvents: 12,
    avgAttendance: '87.3%',
    placementRate: '94.2%'
  },
  'Information Technology': {
    totalStudents: 892,
    totalTeachers: 67,
    activeAnnouncements: 5,
    upcomingEvents: 8,
    avgAttendance: '85.7%',
    placementRate: '91.8%'
  },
  'Electronics': {
    totalStudents: 734,
    totalTeachers: 56,
    activeAnnouncements: 4,
    upcomingEvents: 6,
    avgAttendance: '89.1%',
    placementRate: '88.5%'
  }
};

const departmentAnnouncements = {
  'Computer Science': [
    {
      id: '1',
      title: 'New AI/ML Specialization Program',
      content: 'Department announces new specialization program in AI/ML for final year students. Limited seats available.',
      priority: 'high',
      type: 'academic',
      createdAt: new Date('2024-01-16T14:30:00'),
      createdBy: 'Dr. Rajesh Kumar, HOD'
    },
    {
      id: '2',
      title: 'Industry Expert Lecture Series',
      content: 'Monthly lecture series by industry experts starting next week. First session on Cloud Computing by AWS architect.',
      priority: 'medium',
      type: 'event',
      createdAt: new Date('2024-01-15T11:15:00'),
      createdBy: 'Prof. Priya Sharma'
    },
    {
      id: '3',
      title: 'Lab Equipment Upgrade',
      content: 'CS labs will be upgraded with new hardware during winter break. New systems will support latest development tools.',
      priority: 'low',
      type: 'infrastructure',
      createdAt: new Date('2024-01-14T09:45:00'),
      createdBy: 'Lab Administrator'
    }
  ],
  'Information Technology': [
    {
      id: '4',
      title: 'Cybersecurity Workshop',
      content: 'Three-day cybersecurity workshop for IT students. Registration deadline: January 25th.',
      priority: 'high',
      type: 'workshop',
      createdAt: new Date('2024-01-16T16:20:00'),
      createdBy: 'Dr. Anil Mehta, HOD'
    },
    {
      id: '5',
      title: 'Internship Fair 2024',
      content: 'IT department organizing internship fair with 50+ companies. Students can register through placement portal.',
      priority: 'medium',
      type: 'placement',
      createdAt: new Date('2024-01-15T13:30:00'),
      createdBy: 'Placement Coordinator'
    }
  ]
};

const departmentEvents = {
  'Computer Science': [
    {
      id: '1',
      title: 'CS Symposium 2024',
      type: 'conference',
      date: new Date('2024-02-15T09:00:00'),
      duration: '2 days',
      location: 'CS Auditorium',
      description: 'Annual technical symposium with paper presentations and tech talks'
    },
    {
      id: '2',
      title: 'Coding Competition',
      type: 'competition',
      date: new Date('2024-01-28T10:00:00'),
      duration: '6 hours',
      location: 'CS Lab Complex',
      description: 'Inter-college coding competition with exciting prizes'
    }
  ],
  'Information Technology': [
    {
      id: '3',
      title: 'IT Innovation Expo',
      type: 'exhibition',
      date: new Date('2024-02-10T11:00:00'),
      duration: '3 days',
      location: 'IT Department',
      description: 'Showcase of student projects and innovations'
    }
  ]
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department') || 'Computer Science';
    const type = searchParams.get('type');

    if (type === 'stats') {
      return NextResponse.json({
        success: true,
        data: departmentStats[department as keyof typeof departmentStats] || departmentStats['Computer Science']
      });
    }

    if (type === 'announcements') {
      const announcements = departmentAnnouncements[department as keyof typeof departmentAnnouncements] || departmentAnnouncements['Computer Science'];
      return NextResponse.json({
        success: true,
        data: announcements
      });
    }

    if (type === 'events') {
      const events = departmentEvents[department as keyof typeof departmentEvents] || departmentEvents['Computer Science'];
      const upcomingEvents = events.filter(event => event.date >= new Date());
      return NextResponse.json({
        success: true,
        data: upcomingEvents
      });
    }

    // Return all department data by default
    return NextResponse.json({
      success: true,
      data: {
        stats: departmentStats[department as keyof typeof departmentStats] || departmentStats['Computer Science'],
        announcements: departmentAnnouncements[department as keyof typeof departmentAnnouncements] || departmentAnnouncements['Computer Science'],
        events: departmentEvents[department as keyof typeof departmentEvents] || departmentEvents['Computer Science']
      }
    });
  } catch (error) {
    console.error('Error fetching department data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch department data' },
      { status: 500 }
    );
  }
}
