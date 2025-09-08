import { NextRequest, NextResponse } from 'next/server';

// Demo data for reminders
const demoReminders = [
  {
    id: '1',
    title: 'Submit Project Report',
    description: 'Final year project report submission deadline approaching',
    dueDate: new Date('2024-01-25'),
    reminderType: 'academic',
    isCompleted: false,
    notified: false,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    title: 'Attend Workshop on AI',
    description: 'Department conducting workshop on Artificial Intelligence fundamentals',
    dueDate: new Date('2024-01-22'),
    reminderType: 'event',
    isCompleted: false,
    notified: true,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18')
  },
  {
    id: '3',
    title: 'Library Book Return',
    description: 'Return borrowed books: "Machine Learning Algorithms" and "Data Structures"',
    dueDate: new Date('2024-01-20'),
    reminderType: 'personal',
    isCompleted: false,
    notified: false,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05')
  },
  {
    id: '4',
    title: 'Complete Assignment 3',
    description: 'Database Management Systems assignment on normalization',
    dueDate: new Date('2024-01-28'),
    reminderType: 'academic',
    isCompleted: true,
    notified: true,
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-16')
  },
  {
    id: '5',
    title: 'Register for Campus Placement',
    description: 'Last date to register for upcoming campus recruitment drive',
    dueDate: new Date('2024-01-30'),
    reminderType: 'placement',
    isCompleted: false,
    notified: false,
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-08')
  }
];

export async function GET(request: NextRequest) {
  try {
    // Filter upcoming reminders (not completed and due date >= today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcomingReminders = demoReminders
      .filter(reminder => !reminder.isCompleted && reminder.dueDate >= today)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
      .slice(0, 10); // Limit to 10 reminders

    return NextResponse.json({
      success: true,
      data: upcomingReminders
    });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reminders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, dueDate, reminderType } = body;

    // Simulate creating a new reminder
    const newReminder = {
      id: String(demoReminders.length + 1),
      title,
      description,
      dueDate: new Date(dueDate),
      reminderType,
      isCompleted: false,
      notified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // In a real app, this would be saved to database
    demoReminders.push(newReminder);

    return NextResponse.json({
      success: true,
      data: newReminder,
      message: 'Reminder created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating reminder:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create reminder' },
      { status: 500 }
    );
  }
}
