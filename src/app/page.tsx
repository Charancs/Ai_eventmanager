'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import FloatingChatbot from '@/components/floating-chatbot'
import { 
  MessageCircle, 
  Users, 
  Building, 
  GraduationCap, 
  Moon, 
  Sun, 
  Bot,
  Calendar,
  Bell,
  Shield,
  Zap,
  Globe,
  ArrowRight,
  Check,
  Brain,
  Mic,
  Image,
  MessageSquare,
  CheckCircle,
  Star,
  Award,
  Smartphone,
  Clock,
  UserCheck,
  School,
  Lightbulb,
  Target,
  TrendingUp,
  BookOpen,
  Sparkles,
  Heart,
  Headphones
} from 'lucide-react'

export default function HomePage() {
  const { data: session, status } = useSession()
  const { theme, setTheme } = useTheme()
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="relative">
          <div className="animate-spin rounded-full h-32 w-32 border-4 border-primary/20 border-t-primary"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Bot className="h-12 w-12 text-primary animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="relative">
          <div className="animate-spin rounded-full h-32 w-32 border-4 border-primary/20 border-t-primary"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Bot className="h-12 w-12 text-primary animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <MessageCircle className="h-8 w-8 text-primary" />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">College AI Assistant</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Smart Communication Hub</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="relative"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => router.push('/auth/signin')}
                className="hidden sm:inline-flex"
              >
                Sign In
              </Button>
              <Button onClick={() => router.push('/auth/signup')} className="relative overflow-hidden group">
                <span className="relative z-10">Get Started</span>
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Bot className="h-10 w-10 text-primary" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Zap className="h-3 w-3 text-white" />
              </div>
            </div>
          </div>
          <h2 className="text-5xl font-bold text-foreground mb-6 leading-tight">
            Smart College 
            <span className="text-primary block">Communication Hub</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Experience the future of college communication with our AI-powered chatbot system. 
            Seamlessly connect students, teachers, and administration through intelligent conversations, 
            smart notifications, and multi-modal interactions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button size="lg" onClick={() => router.push('/auth/signup')} className="group">
              Start Your Journey
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push('/auth/signin')}>
              Sign In to Continue
            </Button>
          </div>
        </div>

        {/* User Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <GraduationCap className="h-8 w-8 text-blue-500" />
              </div>
              <CardTitle className="text-blue-700 dark:text-blue-300">For Students</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4">
                Get personalized announcements, exam reminders, assignment deadlines, 
                and stay connected with your academic journey.
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Check className="h-3 w-3 text-green-500 mr-2" />
                  Smart exam reminders
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Check className="h-3 w-3 text-green-500 mr-2" />
                  Assignment tracking
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Check className="h-3 w-3 text-green-500 mr-2" />
                  College announcements
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Users className="h-8 w-8 text-green-500" />
              </div>
              <CardTitle className="text-green-700 dark:text-green-300">For Teachers</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4">
                Create class announcements, manage schedules, set important reminders, 
                and communicate effectively with your students.
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Check className="h-3 w-3 text-green-500 mr-2" />
                  Class announcements
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Check className="h-3 w-3 text-green-500 mr-2" />
                  Schedule management
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Check className="h-3 w-3 text-green-500 mr-2" />
                  Student communication
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Building className="h-8 w-8 text-purple-500" />
              </div>
              <CardTitle className="text-purple-700 dark:text-purple-300">Department Admin</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4">
                Send department-wide announcements, coordinate events, manage communications, 
                and oversee departmental activities.
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Check className="h-3 w-3 text-green-500 mr-2" />
                  Department announcements
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Check className="h-3 w-3 text-green-500 mr-2" />
                  Event coordination
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Check className="h-3 w-3 text-green-500 mr-2" />
                  Communication management
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Shield className="h-8 w-8 text-orange-500" />
              </div>
              <CardTitle className="text-orange-700 dark:text-orange-300">College Admin</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4">
                Manage college-wide announcements, oversee all departments, maintain system 
                administration, and ensure smooth operations.
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Check className="h-3 w-3 text-green-500 mr-2" />
                  College-wide control
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Check className="h-3 w-3 text-green-500 mr-2" />
                  System administration
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Check className="h-3 w-3 text-green-500 mr-2" />
                  Complete oversight
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Features Section */}
        <div className="bg-card/50 backdrop-blur-sm rounded-2xl shadow-lg border p-8 mb-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Powerful Features for Modern Education
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our AI-powered platform brings together cutting-edge technology and educational excellence
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Brain className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-md">
                  <Sparkles className="h-4 w-4 text-black" />
                </div>
              </div>
              <h4 className="text-xl font-semibold mb-3 text-foreground">AI-Powered Intelligence</h4>
              <p className="text-muted-foreground leading-relaxed">
                Advanced AI understands context, remembers conversations, and provides 
                personalized assistance for your academic and administrative needs.
              </p>
            </div>

            <div className="text-center group">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Bell className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-red-400 rounded-full flex items-center justify-center shadow-md">
                  <Clock className="h-4 w-4 text-white" />
                </div>
              </div>
              <h4 className="text-xl font-semibold mb-3 text-foreground">Smart Notifications</h4>
              <p className="text-muted-foreground leading-relaxed">
                Intelligent reminder system that learns your patterns and sends timely 
                notifications for exams, assignments, and important events.
              </p>
            </div>

            <div className="text-center group">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <UserCheck className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full flex items-center justify-center shadow-md">
                  <Shield className="h-4 w-4 text-white" />
                </div>
              </div>
              <h4 className="text-xl font-semibold mb-3 text-foreground">Role-Based Access</h4>
              <p className="text-muted-foreground leading-relaxed">
                Customized experience tailored to your role - whether you're a student, 
                teacher, or administrator, get exactly what you need.
              </p>
            </div>
          </div>
        </div>

        {/* Multi-Modal Features Showcase */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Communicate Your Way
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Express yourself through text, voice, or images. Our AI understands all forms of communication.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/50 overflow-hidden">
              <CardContent className="p-8 text-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                    <MessageSquare className="h-8 w-8 text-emerald-500" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Zap className="h-3 w-3 text-white" />
                  </div>
                </div>
                <h4 className="text-xl font-semibold mb-3 text-emerald-700 dark:text-emerald-300">Text Messages</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Type naturally and get instant responses. Perfect for quick questions, 
                  detailed explanations, and formal communications.
                </p>
                <div className="mt-4 p-3 bg-white/50 dark:bg-black/20 rounded-lg text-sm text-muted-foreground">
                  "When is my next exam?"
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-950/50 dark:to-violet-900/50 overflow-hidden">
              <CardContent className="p-8 text-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                    <Headphones className="h-8 w-8 text-violet-500" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                    <Mic className="h-3 w-3 text-white" />
                  </div>
                </div>
                <h4 className="text-xl font-semibold mb-3 text-violet-700 dark:text-violet-300">Voice Commands</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Speak naturally for hands-free interaction. Great for quick queries 
                  while studying or when you're busy with other tasks.
                </p>
                <div className="mt-4 p-3 bg-white/50 dark:bg-black/20 rounded-lg text-sm text-muted-foreground flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span>Voice message...</span>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/50 overflow-hidden">
              <CardContent className="p-8 text-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                    <Image className="h-8 w-8 text-amber-500" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-white" />
                  </div>
                </div>
                <h4 className="text-xl font-semibold mb-3 text-amber-700 dark:text-amber-300">Image Processing</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Share screenshots of assignments, schedules, or documents. 
                  AI can read and understand visual content to provide better help.
                </p>
                <div className="mt-4 p-3 bg-white/50 dark:bg-black/20 rounded-lg text-sm text-muted-foreground">
                  📷 Image uploaded
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI Capabilities Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div className="space-y-6">
            <h3 className="text-3xl font-bold text-foreground">
              Intelligent Conversation Memory
            </h3>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Our AI remembers your previous conversations, preferences, and important dates. 
              Build a continuous relationship with your digital assistant that grows smarter over time.
            </p>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center mt-1">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Contextual Understanding</h4>
                  <p className="text-muted-foreground">AI understands context from past conversations</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center mt-1">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Personal Preferences</h4>
                  <p className="text-muted-foreground">Learns and adapts to your communication style</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center mt-1">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Continuous Learning</h4>
                  <p className="text-muted-foreground">Gets better with every interaction</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 border">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Bot className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">AI Assistant</span>
                </div>
                <div className="bg-background rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-foreground">
                    "I remember you have a Computer Science exam next Tuesday. Would you like me to set up 
                    study reminders for the weekend?"
                  </p>
                </div>
                <div className="flex items-center space-x-3 justify-end">
                  <span className="text-sm font-medium text-muted-foreground">You</span>
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <div className="bg-primary rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-primary-foreground">
                    "Yes, please! Also remind me about the project submission deadline we discussed last week."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 rounded-2xl p-12 border">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-3xl font-bold mb-4 text-foreground">Ready to Transform Your College Experience?</h3>
            <p className="text-muted-foreground mb-8 text-lg">
              Join thousands of students, teachers, and administrators who are already experiencing 
              the future of college communication. Start your journey today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => router.push('/auth/signup')} className="group relative overflow-hidden">
                <span className="relative z-10 flex items-center">
                  Create Your Account
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
              <Button size="lg" variant="outline" onClick={() => router.push('/auth/signin')}>
                Sign In to Continue
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Free to use • No credit card required • Instant setup
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <MessageCircle className="h-6 w-6 text-primary" />
              <span className="font-semibold text-foreground">College AI Assistant</span>
            </div>
            <p className="text-muted-foreground">&copy; 2025 College AI Assistant. Transforming education through intelligent communication.</p>
          </div>
        </div>
      </footer>

      {/* Floating Chatbot */}
      <FloatingChatbot />
    </div>
  )
}
