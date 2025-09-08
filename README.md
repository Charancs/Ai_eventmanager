# College AI Chatbot System

A comprehensive AI-powered chatbot system designed for college communication and management. This system provides role-based access for students, teachers, department administrators, and college administrators.

## Features

### Multi-Role Support
- **Students**: Get announcements, set reminders, track deadlines
- **Teachers**: Create class announcements, manage schedules, communicate with students
- **Department Admins**: Manage department-wide communications and events
- **College Admins**: Oversee college-wide announcements and system administration

### Key Capabilities
- 🗨️ **Multi-modal Input**: Text, voice, and image support
- 🔔 **Smart Reminders**: Intelligent notification system for exams, assignments, and events
- 📢 **Announcement System**: Role-based announcement distribution
- 💾 **Conversation History**: Persistent chat history
- 🎯 **Role-based Access**: Customized experience based on user role
- 📱 **Responsive Design**: Works on all devices

## Tech Stack

### Frontend
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Radix UI** - Component library
- **NextAuth.js** - Authentication
- **Lucide React** - Icons

### Backend
- **Prisma** - Database ORM
- **MySQL** - Database
- **NextAuth.js** - Session management
- **bcryptjs** - Password hashing

### AI Integration
- **Python Backend** (separate) - OpenAI integration
- **RESTful APIs** - Communication between frontend and Python backend

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- MySQL 8.0+
- Python 3.8+ (for AI backend)

### Database Setup
1. Install MySQL and create a database named `college_chatbot`
2. Update the `DATABASE_URL` in `.env` file with your MySQL credentials:
   ```
   DATABASE_URL="mysql://username:password@localhost:3306/college_chatbot"
   ```

### Frontend Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

3. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

4. Seed the database (optional):
   ```bash
   npx prisma db seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Environment Variables
Create a `.env` file with the following variables:
```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/college_chatbot"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# OpenAI (for backend integration)
OPENAI_API_KEY="your-openai-api-key"

# Python Backend URL
PYTHON_BACKEND_URL="http://localhost:8000"
```

### Python Backend Setup
The Python backend for AI processing should be set up separately in the `Backend` folder with:
- FastAPI or Flask
- OpenAI API integration
- Database connection for AI conversation storage

## Project Structure

```
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── student/           # Student dashboard
│   │   ├── teacher/           # Teacher dashboard
│   │   ├── department/        # Department admin dashboard
│   │   └── admin/             # College admin dashboard
│   ├── components/            # Reusable components
│   │   ├── ui/               # UI components
│   │   ├── chatbot.tsx       # Main chatbot component
│   │   └── dashboard-layout.tsx
│   ├── lib/                   # Utilities
│   │   ├── prisma.ts         # Database client
│   │   └── auth.ts           # Auth configuration
│   └── types/                 # TypeScript definitions
├── prisma/                    # Database schema and migrations
├── Backend/                   # Python AI backend (separate setup)
└── public/                    # Static assets
```

## Usage

### User Registration
1. Visit the homepage
2. Click "Sign Up"
3. Select your role (Student/Teacher/Department Admin)
4. Fill in the required information
5. Complete registration

### Dashboard Access
After login, users are redirected to their role-specific dashboard:
- Students: `/student/dashboard`
- Teachers: `/teacher/dashboard` 
- Department Admins: `/department/dashboard`
- College Admins: `/admin/dashboard`

### Chatbot Features
- Send text messages
- Upload images for processing
- Use voice input (browser-supported)
- Set reminders for important dates
- Get announcements and updates
- Conversation history is automatically saved

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

### Chat
- `POST /api/chat` - Send message to chatbot

### Reminders
- `GET /api/reminders` - Get user reminders
- `POST /api/reminders` - Create new reminder

### Announcements
- `GET /api/announcements` - Get relevant announcements
- `POST /api/announcements` - Create announcement (role-based)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.
