import { NextRequest, NextResponse } from 'next/server';

// Demo data for admin statistics
const adminStats = {
  totalStudents: 3847,
  totalTeachers: 284,
  totalDepartments: 12,
  activeAnnouncements: 15,
  totalEvents: 23,
  pendingApprovals: 7,
  systemHealth: 'Good',
  storageUsed: '67%'
};

// Demo data for system alerts
const systemAlerts = [
  {
    id: '1',
    type: 'warning',
    title: 'Server Maintenance Scheduled',
    message: 'Routine server maintenance scheduled for this weekend',
    priority: 'medium',
    timestamp: new Date('2024-01-18T10:30:00'),
    resolved: false
  },
  {
    id: '2',
    type: 'info',
    title: 'Database Backup Completed',
    message: 'Daily database backup completed successfully',
    priority: 'low',
    timestamp: new Date('2024-01-18T02:15:00'),
    resolved: true
  },
  {
    id: '3',
    type: 'error',
    title: 'Payment Gateway Issue',
    message: 'Temporary issue with payment processing system',
    priority: 'high',
    timestamp: new Date('2024-01-17T14:45:00'),
    resolved: false
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'stats') {
      return NextResponse.json({
        success: true,
        data: adminStats
      });
    }

    if (type === 'alerts') {
      return NextResponse.json({
        success: true,
        data: systemAlerts
      });
    }

    // Return both by default
    return NextResponse.json({
      success: true,
      data: {
        stats: adminStats,
        alerts: systemAlerts
      }
    });
  } catch (error) {
    console.error('Error fetching admin data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch admin data' },
      { status: 500 }
    );
  }
}
