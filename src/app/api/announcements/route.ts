import { NextRequest, NextResponse } from 'next/server';

// Demo data for announcements
const demoAnnouncements = [
  {
    id: '1',
    title: 'Mid-Semester Examination Schedule Released',
    content: 'The mid-semester examination schedule has been published. Please check the academic portal for your exam dates and timings. All students are required to carry their ID cards during examinations.',
    type: 'academic',
    department: 'all',
    priority: 'high',
    createdBy: 'Academic Office',
    isActive: true,
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16')
  },
  {
    id: '2',
    title: 'Workshop on Machine Learning Applications',
    content: 'Department of Computer Science is organizing a 3-day workshop on Machine Learning Applications in Industry. Guest speakers from top tech companies will share insights. Registration deadline: January 25th.',
    type: 'department',
    department: 'Computer Science',
    priority: 'medium',
    createdBy: 'CS Department',
    isActive: true,
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14')
  },
  {
    id: '3',
    title: 'Library Extended Hours During Exams',
    content: 'The central library will remain open 24/7 during the examination period (Jan 22 - Feb 5). Additional study spaces have been arranged in the conference halls.',
    type: 'general',
    department: 'all',
    priority: 'medium',
    createdBy: 'Library Administration',
    isActive: true,
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12')
  },
  {
    id: '4',
    title: 'Campus Placement Drive - Tech Giants',
    content: 'Major tech companies including Google, Microsoft, and Amazon will be visiting for campus placements. Eligible students (CGPA > 7.5) should register by January 30th through the placement portal.',
    type: 'placement',
    department: 'all',
    priority: 'high',
    createdBy: 'Placement Cell',
    isActive: true,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '5',
    title: 'Research Paper Submission Competition',
    content: 'Annual research paper competition is now open for all final year students. Submit your original research work by February 15th. Winners will receive cash prizes and publication opportunities.',
    type: 'academic',
    department: 'all',
    priority: 'medium',
    createdBy: 'Research Committee',
    isActive: true,
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-08')
  }
];

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const department = searchParams.get('department');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Filter announcements based on query parameters
    let filteredAnnouncements = demoAnnouncements.filter(announcement => announcement.isActive);

    // Filter by type if specified
    if (type && type !== 'all') {
      filteredAnnouncements = filteredAnnouncements.filter(announcement => 
        announcement.type === type
      );
    }

    // Filter by department if specified
    if (department && department !== 'all') {
      filteredAnnouncements = filteredAnnouncements.filter(announcement => 
        announcement.department === 'all' || announcement.department === department
      );
    }

    // Sort by priority (high -> medium -> low) and then by creation date (newest first)
    const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
    filteredAnnouncements.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
      if (priorityDiff !== 0) return priorityDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    // Apply limit
    const limitedAnnouncements = filteredAnnouncements.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: limitedAnnouncements,
      total: filteredAnnouncements.length
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch announcements' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, type, department, priority } = body;

    // Simulate creating a new announcement
    const newAnnouncement = {
      id: String(demoAnnouncements.length + 1),
      title,
      content,
      type,
      department: department || 'all',
      priority: priority || 'medium',
      createdBy: 'System Admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // In a real app, this would be saved to database
    demoAnnouncements.unshift(newAnnouncement); // Add to beginning

    return NextResponse.json({
      success: true,
      data: newAnnouncement,
      message: 'Announcement created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create announcement' },
      { status: 500 }
    );
  }
}
