'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, Users, Building, GraduationCap } from 'lucide-react'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (session?.user?.role) {
      // Redirect based on role
      switch (session.user.role) {
        case 'ADMIN':
          router.push('/admin/dashboard')
          break
        case 'DEPARTMENT_ADMIN':
          router.push('/department/dashboard')
          break
        case 'TEACHER':
          router.push('/teacher/dashboard')
          break
        case 'STUDENT':
          router.push('/student/dashboard')
          break
        default:
          break
      }
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <MessageCircle className="h-8 w-8 text-blue-500 mr-2" />
              <h1 className="text-xl font-bold text-gray-900">College AI Chatbot</h1>
            </div>
            <div className="space-x-4">
              <Button 
                variant="outline" 
                onClick={() => router.push('/auth/signin')}
              >
                Sign In
              </Button>
              <Button onClick={() => router.push('/auth/signup')}>
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Smart College Communication Hub
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            AI-powered chatbot system designed for seamless communication between students, 
            teachers, and administration. Get announcements, set reminders, and stay connected 
            with your college community.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <Card className="text-center">
            <CardHeader>
              <GraduationCap className="h-12 w-12 text-blue-500 mx-auto mb-2" />
              <CardTitle>For Students</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Get college announcements, department updates, exam reminders, 
                and track important deadlines.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <CardTitle>For Teachers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Create class announcements, manage schedules, set reminders, 
                and communicate with students effectively.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Building className="h-12 w-12 text-purple-500 mx-auto mb-2" />
              <CardTitle>Department Admin</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Send department-wide announcements, coordinate events, 
                and manage departmental communications.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <MessageCircle className="h-12 w-12 text-orange-500 mx-auto mb-2" />
              <CardTitle>College Admin</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Manage college-wide announcements, oversee all departments, 
                and maintain system administration.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Key Features */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <h3 className="text-2xl font-bold text-center mb-8">Key Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <MessageCircle className="h-8 w-8 text-blue-500" />
              </div>
              <h4 className="font-semibold mb-2">Multi-Modal Input</h4>
              <p className="text-gray-600">Support for text, voice, and image inputs for seamless communication.</p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Building className="h-8 w-8 text-green-500" />
              </div>
              <h4 className="font-semibold mb-2">Smart Notifications</h4>
              <p className="text-gray-600">Intelligent reminder system for exams, assignments, and important events.</p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-purple-500" />
              </div>
              <h4 className="font-semibold mb-2">Role-Based Access</h4>
              <p className="text-gray-600">Customized experience based on user role - student, teacher, or admin.</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="text-gray-600 mb-8">
            Join thousands of students, teachers, and administrators who are already using 
            our AI-powered communication platform.
          </p>
          <div className="space-x-4">
            <Button size="lg" onClick={() => router.push('/auth/signup')}>
              Create Account
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push('/auth/signin')}>
              Sign In
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 College AI Chatbot. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
