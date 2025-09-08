import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create sample users for each role
  const hashedPassword = await bcrypt.hash('password123', 12)

  // Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@college.edu' },
    update: {},
    create: {
      email: 'admin@college.edu',
      name: 'System Administrator',
      password: hashedPassword,
      role: 'ADMIN'
    }
  })

  // Department Admin
  const deptAdmin = await prisma.user.upsert({
    where: { email: 'cs.admin@college.edu' },
    update: {},
    create: {
      email: 'cs.admin@college.edu',
      name: 'CS Department Head',
      password: hashedPassword,
      role: 'DEPARTMENT_ADMIN',
      department: 'Computer Science',
      employeeId: 'EMP001'
    }
  })

  // Teacher
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@college.edu' },
    update: {},
    create: {
      email: 'teacher@college.edu',
      name: 'Dr. John Smith',
      password: hashedPassword,
      role: 'TEACHER',
      department: 'Computer Science',
      employeeId: 'EMP002'
    }
  })

  // Student
  const student = await prisma.user.upsert({
    where: { email: 'student@college.edu' },
    update: {},
    create: {
      email: 'student@college.edu',
      name: 'Jane Doe',
      password: hashedPassword,
      role: 'STUDENT',
      department: 'Computer Science',
      year: '3',
      rollNo: 'CS2022001'
    }
  })

  // Create sample announcements
  await prisma.announcement.createMany({
    data: [
      {
        title: 'Welcome to New Academic Year',
        content: 'Welcome all students and faculty to the new academic year 2025. We have exciting plans and updates for this year.',
        type: 'COLLEGE',
        priority: 'HIGH',
        createdBy: admin.id
      },
      {
        title: 'CS Department Orientation',
        content: 'All Computer Science students are invited to attend the department orientation on March 15th at 10 AM in the main auditorium.',
        type: 'DEPARTMENT',
        department: 'Computer Science',
        priority: 'MEDIUM',
        createdBy: deptAdmin.id
      },
      {
        title: 'Programming Contest',
        content: 'Annual programming contest will be held on April 1st. Register with your department coordinator.',
        type: 'DEPARTMENT',
        department: 'Computer Science',
        priority: 'MEDIUM',
        createdBy: teacher.id
      }
    ]
  })

  // Create sample reminders
  await prisma.reminder.createMany({
    data: [
      {
        userId: student.id,
        title: 'Data Structures Exam',
        description: 'Prepare for the mid-semester Data Structures exam',
        dueDate: new Date('2025-03-20'),
        reminderType: 'EXAM'
      },
      {
        userId: student.id,
        title: 'Web Development Project',
        description: 'Submit the final web development project',
        dueDate: new Date('2025-03-25'),
        reminderType: 'PROJECT'
      },
      {
        userId: teacher.id,
        title: 'Grade Submission Deadline',
        description: 'Submit mid-semester grades for all courses',
        dueDate: new Date('2025-03-30'),
        reminderType: 'ASSIGNMENT'
      }
    ]
  })

  console.log('Database seeded successfully!')
  console.log('\nSample login credentials:')
  console.log('Admin: admin@college.edu / password123')
  console.log('Department Admin: cs.admin@college.edu / password123')  
  console.log('Teacher: teacher@college.edu / password123')
  console.log('Student: student@college.edu / password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
