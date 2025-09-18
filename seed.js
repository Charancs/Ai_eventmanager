const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

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
      role: 'ADMIN',
      department: 'admin',
      employeeId: 'EMP003'
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
    where: { email: 'john.teacher@college.edu' },
    update: {},
    create: {
      email: 'john.teacher@college.edu',
      name: 'John Teacher',
      password: hashedPassword,
      role: 'TEACHER',
      department: 'Computer Science',
      employeeId: 'EMP002'
    }
  })

  // Student
  const student = await prisma.user.upsert({
    where: { email: 'jane.student@college.edu' },
    update: {},
    create: {
      email: 'jane.student@college.edu',
      name: 'Jane Student',
      password: hashedPassword,
      role: 'STUDENT',
      department: 'Computer Science',
      year: '3rd Year',
      rollNo: 'CS21001'
    }
  })

  console.log('Created users:')
  console.log('Admin:', admin.email, '- password: password123')
  console.log('Dept Admin:', deptAdmin.email, '- password: password123')
  console.log('Teacher:', teacher.email, '- password: password123')
  console.log('Student:', student.email, '- password: password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
