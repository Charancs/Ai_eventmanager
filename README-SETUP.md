# AI Event Manager - Setup Guide

## 🚀 Quick Start

This guide will help you set up and run the AI Event Manager project locally.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** or **yarn** package manager
- **MySQL** database (local or cloud)
- **Git** for version control

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Charancs/Ai_eventmanager.git
cd Ai_eventmanager
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL="mysql://username:password@localhost:3306/ai_eventmanager"

# NextAuth Configuration
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Optional: Database Direct URL (for migrations)
DIRECT_URL="mysql://username:password@localhost:3306/ai_eventmanager"
```

**Important:** Replace the database credentials with your actual MySQL configuration.

### 4. Database Setup

#### Generate Prisma Client
```bash
npx prisma generate
```

#### Run Database Migrations
```bash
npx prisma db push
```

#### Seed the Database (Create Test Users)
```bash
npx ts-node prisma/seed.ts
```

This will create test users with the following credentials:
- **Admin**: `admin@college.edu` / `password123`
- **Department Admin**: `cs.admin@college.edu` / `password123`
- **Teacher**: `teacher@college.edu` / `password123`
- **Student**: `student@college.edu` / `password123`

## 🏃‍♂️ Running the Project

### Development Mode
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`

### Production Build
```bash
npm run build
npm run start
# or
yarn build
yarn start
```

## 📊 Database Management

### View Database in Prisma Studio
```bash
npx prisma studio
```

### Reset Database (if needed)
```bash
npx prisma db push --force-reset
npx ts-node prisma/seed.ts
```

### Generate New Migration
```bash
npx prisma db push
```

## 🔄 Git Workflow

### Initial Setup
```bash
git add .
git commit -m "Initial setup"
git push origin main
```

### Daily Development
```bash
# Pull latest changes
git pull origin main

# Make your changes...

# Add and commit changes
git add .
git commit -m "Your descriptive commit message"

# Push to repository
git push origin main
```

### Branch Management
```bash
# Create a new feature branch
git checkout -b feature/your-feature-name

# Work on your feature...

# Push feature branch
git push origin feature/your-feature-name

# Merge back to main (after review)
git checkout main
git merge feature/your-feature-name
git push origin main
```

## 🧪 Testing the Application

### 1. Login with Different Roles

Visit `http://localhost:3000/auth/signin` and login with:

**Student Dashboard:**
- Email: `student@college.edu`
- Password: `password123`
- Access: Student dashboard with AI chat, reminders, announcements

**Teacher Dashboard:**
- Email: `teacher@college.edu`
- Password: `password123`
- Access: Teacher dashboard with classes, events, class announcements

**Department Dashboard:**
- Email: `cs.admin@college.edu`
- Password: `password123`
- Access: Department management, stats, department-specific content

**Admin Dashboard:**
- Email: `admin@college.edu`
- Password: `password123`
- Access: Full system access, all statistics, system alerts

### 2. Test Key Features

- ✅ Role-based dashboard access
- ✅ Floating collapsible sidebar
- ✅ AI chat assistants
- ✅ Real-time data display
- ✅ Responsive design
- ✅ Sign in/out functionality

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error:**
```bash
# Check your DATABASE_URL in .env file
# Ensure MySQL is running
# Verify database credentials
```

**Prisma Client Not Generated:**
```bash
npx prisma generate
```

**Build Errors:**
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

**Port Already in Use:**
```bash
# Kill process on port 3000
npx kill-port 3000
# Or use different port
npm run dev -- -p 3001
```

### Database Reset (if corrupted)
```bash
npx prisma db push --force-reset
npx ts-node prisma/seed.ts
```

## 📱 Development Tips

1. **Hot Reload**: The development server automatically reloads on file changes
2. **TypeScript**: Full TypeScript support with type checking
3. **Tailwind CSS**: Use Tailwind classes for styling
4. **Component Structure**: Follow the existing component patterns
5. **API Routes**: Add new APIs in `/src/app/api/` directory

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Manual Deployment
```bash
npm run build
# Upload 'out' folder to your hosting provider
```

### Environment Variables for Production
Ensure these are set in your production environment:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (your production domain)

## 📞 Support

If you encounter any issues:

1. Check this README first
2. Look at the error logs in the terminal
3. Verify your environment variables
4. Ensure database is running and accessible
5. Try resetting the database if data seems corrupted

## 🔄 Updates

To update the project:
```bash
git pull origin main
npm install
npx prisma generate
npx prisma db push
```

---

**Happy Coding! 🎉**
