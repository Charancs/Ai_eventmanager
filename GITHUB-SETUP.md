# AI Event Manager - GitHub Setup Guide

## 🔗 Repository Information

**GitHub Repository**: https://github.com/Charancs/Ai_eventmanager  
**Project Type**: Next.js 15 + TypeScript + MySQL + Prisma  
**Live Demo**: [Coming Soon]

## 📥 Cloning from GitHub

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/Charancs/Ai_eventmanager.git

# Navigate to project directory
cd Ai_eventmanager

# Check repository status
git status
```

### Step 2: Install Dependencies

```bash
# Install all required packages
npm install

# or if you prefer yarn
yarn install
```

## ⚙️ Configuration Requirements

### 🔧 Required Data Changes

After cloning, you **MUST** update the following configurations:

### 1. Environment Variables (`.env` file)

Create a `.env` file in the root directory and update these values:

```env
# Database Configuration - UPDATE WITH YOUR DATABASE
DATABASE_URL="mysql://YOUR_USERNAME:YOUR_PASSWORD@YOUR_HOST:3306/YOUR_DATABASE_NAME"

# NextAuth Configuration - GENERATE NEW SECRET
NEXTAUTH_SECRET="YOUR_UNIQUE_SECRET_KEY_HERE"
NEXTAUTH_URL="http://localhost:3000"

# Optional: For production deployment
DIRECT_URL="mysql://YOUR_USERNAME:YOUR_PASSWORD@YOUR_HOST:3306/YOUR_DATABASE_NAME"
```

**⚠️ IMPORTANT**: 
- Replace `YOUR_USERNAME`, `YOUR_PASSWORD`, `YOUR_HOST`, `YOUR_DATABASE_NAME` with your actual MySQL credentials
- Generate a new `NEXTAUTH_SECRET` using: `openssl rand -base64 32`

### 2. Database Setup

#### Option A: Local MySQL Database
```bash
# Create a new database in MySQL
mysql -u root -p
CREATE DATABASE ai_eventmanager;
exit;
```

#### Option B: Cloud Database (Recommended)
Use services like:
- **PlanetScale** (MySQL compatible)
- **Railway** (PostgreSQL/MySQL)
- **Supabase** (PostgreSQL)
- **AWS RDS** or **Google Cloud SQL**

### 3. Update Database Connection

In your `.env` file, use the connection string format:

**For MySQL:**
```env
DATABASE_URL="mysql://username:password@host:port/database"
```

**For PostgreSQL (if switching):**
```env
DATABASE_URL="postgresql://username:password@host:port/database"
```

## 🗄️ Database Migration & Seeding

### Step 1: Generate Prisma Client
```bash
npx prisma generate
```

### Step 2: Push Database Schema
```bash
npx prisma db push
```

### Step 3: Seed Database with Test Data
```bash
npx ts-node prisma/seed.ts
```

This creates test users:
- **Admin**: `admin@college.edu` / `password123`
- **Department Admin**: `cs.admin@college.edu` / `password123`
- **Teacher**: `teacher@college.edu` / `password123`
- **Student**: `student@college.edu` / `password123`

## 🚀 Running the Project

### Development Mode
```bash
npm run dev
```

Visit: `http://localhost:3000`

### Production Build
```bash
npm run build
npm start
```

## 🔄 Customization Options

### 1. College Information
Update college-specific data in:

**File**: `prisma/seed.ts`
```typescript
// Update college name and details
name: 'Your College Name',
department: 'Your Department Name',
```

**File**: `src/app/*/dashboard/page.tsx`
```typescript
// Update dashboard headers
<h1>Your College Dashboard</h1>
<p>Welcome to Your College Name</p>
```

### 2. Department Names
Update department options in:

**File**: `prisma/seed.ts`
```typescript
department: 'Computer Science', // Change to your departments
department: 'Information Technology',
department: 'Electronics',
// Add more departments as needed
```

### 3. Demo Data
Customize announcements, events, and reminders in:

**Files**: 
- `src/app/api/admin/route.ts`
- `src/app/api/teacher/route.ts`
- `src/app/api/department/route.ts`
- `src/app/api/announcements/route.ts`
- `src/app/api/reminders/route.ts`

### 4. Color Scheme & Branding
Update colors in Tailwind CSS classes throughout the components:
```typescript
// Current: Purple/Blue theme
className="bg-gradient-to-br from-purple-600/20 to-blue-600/20"

// Change to your college colors
className="bg-gradient-to-br from-green-600/20 to-yellow-600/20"
```

## 🌐 Deployment Options

### Vercel (Recommended)
1. Push your changes to GitHub
2. Connect your GitHub repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Railway
1. Connect GitHub repository
2. Add environment variables
3. Deploy with automatic CI/CD

### Manual Server
1. Build the project: `npm run build`
2. Upload files to your server
3. Set environment variables
4. Run: `npm start`

## 🔐 Security Checklist

Before deploying:

- [ ] Generate new `NEXTAUTH_SECRET`
- [ ] Use secure database credentials
- [ ] Update default passwords
- [ ] Configure CORS if needed
- [ ] Set up SSL/HTTPS for production
- [ ] Review and update user permissions

## 📋 Testing Your Setup

### 1. Database Connection
```bash
npx prisma studio
```
Should open database viewer at `http://localhost:5555`

### 2. Authentication Test
1. Visit `http://localhost:3000/auth/signin`
2. Login with test credentials
3. Verify role-based dashboard access

### 3. API Endpoints Test
Test these URLs in browser:
- `http://localhost:3000/api/announcements`
- `http://localhost:3000/api/reminders`
- `http://localhost:3000/api/admin`

## 🆘 Common Issues

### Database Connection Failed
```bash
# Check your DATABASE_URL format
# Ensure MySQL server is running
# Verify credentials and database exists
```

### Prisma Client Error
```bash
npx prisma generate
npx prisma db push
```

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next
npm run dev
```

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000
# Or use different port
npm run dev -- -p 3001
```

## 📞 Support & Contribution

**Repository**: https://github.com/Charancs/Ai_eventmanager  
**Issues**: https://github.com/Charancs/Ai_eventmanager/issues  
**Discussions**: https://github.com/Charancs/Ai_eventmanager/discussions

### Contributing
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add some feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**🎉 You're all set! Your AI Event Manager is ready to go!**

For detailed project documentation, see [README.md](README.md)
