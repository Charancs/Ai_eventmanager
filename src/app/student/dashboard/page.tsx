'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { notificationsApi, systemApi } from '@/lib/api'
import DocumentSearch from '@/components/document-search'
import { 
  Calendar, 
  Bell, 
  BookOpen, 
  GraduationCap, 
  LogOut, 
  MessageSquare,
  Star,
  Brain,
  CheckCircle2,
  AlertCircle,
  Mic,
  Image,
  Send,
  School,
  UserCheck,
  Megaphone,
  Sun,
  Moon,
  Menu,
  X,
  ChevronDown,
  Users,
  Home,
  Settings,
  User,
  Clock,
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface Reminder {
  id: string
  title: string
  dueDate: string
  type: string
  description?: string
}

interface Announcement {
  id: string
  title: string
  content: string
  type: string
  createdAt: string
  priority: string
}

export default function StudentDashboard() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedChatbot, setSelectedChatbot] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [notifications, setNotifications] = useState<any[]>([])
  const [systemStats, setSystemStats] = useState<any>({})

  useEffect(() => {
    setMounted(true)
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Mock user ID (in real app, get from session)
      const userId = 1;
      
      // Fetch notifications from backend
      const notificationsData = await notificationsApi.getUserNotifications(userId, { limit: 5 });
      setNotifications(notificationsData.slice(0, 5));

      // Fetch system stats
      const statsData = await systemApi.getStats();
      setSystemStats(statsData);

      // Keep existing API calls for reminders and announcements
      const remindersResponse = await fetch('/api/reminders')
      if (remindersResponse.ok) {
        const remindersData = await remindersResponse.json()
        setUpcomingReminders(remindersData.data?.slice(0, 5) || [])
      }

      const announcementsResponse = await fetch('/api/announcements')
      if (announcementsResponse.ok) {
        const announcementsData = await announcementsResponse.json()
        setAnnouncements(announcementsData.data?.slice(0, 5) || [])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  const sendMessage = () => {
    if (!message.trim() || !selectedChatbot) return
    
    const newMessage = {
      id: Date.now(),
      text: message,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }
    
    setChatMessages(prev => [...prev, newMessage])
    setMessage('')
    
    // Simulate AI response
    setTimeout(() => {
      const responses = {
        'college': "I'll help you with college announcements and important events. What would you like to know?",
        'department': "I can assist you with department-specific information and events. How can I help?",
        'student': "I'm your personal academic assistant. I can help track your assignments, exams, and deadlines. What do you need?",
        'teacher': "I'll help you connect with your teachers and get academic support. What's your question?"
      }
      
      const aiResponse = {
        id: Date.now() + 1,
        text: responses[selectedChatbot as keyof typeof responses] || "Hello! How can I assist you today?",
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      }
      
      setChatMessages(prev => [...prev, aiResponse])
    }, 1000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950" suppressHydrationWarning>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Floating Sidebar */}
      <div className={`fixed left-4 top-4 bottom-4 ${sidebarCollapsed ? 'w-20' : 'w-80'} bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl shadow-2xl rounded-2xl border border-white/20 dark:border-slate-700/50 z-50 transition-all duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} overflow-hidden`}>
        <div className={`h-full flex flex-col ${sidebarCollapsed ? 'p-4' : 'p-6'}`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">Student Portal</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{session?.user?.name}</p>
                </div>
              </div>
            )}
            {sidebarCollapsed && (
              <div className="w-full flex flex-col items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg mb-2">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <Button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 hidden lg:flex"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0"
                >
                  {mounted && theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                <Button
                  onClick={() => setSidebarOpen(false)}
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 lg:hidden"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none">
            <nav className="space-y-2 mb-6">
            <Button 
              variant="default" 
              className={`w-full ${sidebarCollapsed ? 'h-12 w-12 p-0 mx-auto' : 'justify-start'} bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700`}
              title={sidebarCollapsed ? "Dashboard" : ""}
            >
              <Home className="w-5 h-5" />
              {!sidebarCollapsed && <span className="ml-3">Dashboard</span>}
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full ${sidebarCollapsed ? 'h-12 w-12 p-0 mx-auto' : 'justify-start'} hover:bg-blue-50 dark:hover:bg-blue-900/20`}
              title={sidebarCollapsed ? "Announcements" : ""}
            >
              <Bell className="w-5 h-5" />
              {!sidebarCollapsed && (
                <>
                  <span className="ml-3">Announcements</span>
                  <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-600">{announcements.length}</Badge>
                </>
              )}
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full ${sidebarCollapsed ? 'h-12 w-12 p-0 mx-auto' : 'justify-start'} hover:bg-blue-50 dark:hover:bg-blue-900/20`}
              title={sidebarCollapsed ? "Events" : ""}
            >
              <Calendar className="w-5 h-5" />
              {!sidebarCollapsed && (
                <>
                  <span className="ml-3">Events</span>
                  <Badge variant="secondary" className="ml-auto bg-green-100 text-green-600">{upcomingReminders.length}</Badge>
                </>
              )}
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full ${sidebarCollapsed ? 'h-12 w-12 p-0 mx-auto' : 'justify-start'} hover:bg-blue-50 dark:hover:bg-blue-900/20`}
              title={sidebarCollapsed ? "AI Assistant" : ""}
            >
              <Brain className="w-5 h-5" />
              {!sidebarCollapsed && <span className="ml-3">AI Assistant</span>}
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full ${sidebarCollapsed ? 'h-12 w-12 p-0 mx-auto' : 'justify-start'} hover:bg-blue-50 dark:hover:bg-blue-900/20`}
              title={sidebarCollapsed ? "Profile" : ""}
            >
              <User className="w-5 h-5" />
              {!sidebarCollapsed && <span className="ml-3">Profile</span>}
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full ${sidebarCollapsed ? 'h-12 w-12 p-0 mx-auto' : 'justify-start'} hover:bg-blue-50 dark:hover:bg-blue-900/20`}
              title={sidebarCollapsed ? "Settings" : ""}
            >
              <Settings className="w-5 h-5" />
              {!sidebarCollapsed && <span className="ml-3">Settings</span>}
            </Button>
            </nav>

            {!sidebarCollapsed && (
              <>
                {/* Quick Stats */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Quick Overview
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-3 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
                      <div className="flex items-center justify-between">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="text-lg font-bold text-blue-700 dark:text-blue-400">{upcomingReminders.length}</span>
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Events</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-3 rounded-xl border border-green-200/50 dark:border-green-800/50">
                      <div className="flex items-center justify-between">
                        <Bell className="w-4 h-4 text-green-600" />
                        <span className="text-lg font-bold text-green-700 dark:text-green-400">{announcements.length}</span>
                      </div>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">Updates</p>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="flex-1 min-h-0 mb-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Recent Activity
                  </h3>
                  <div className="space-y-3 overflow-y-auto max-h-32">
                    {upcomingReminders.slice(0, 3).map((item) => (
                      <div key={item.id} className="p-3 bg-gray-50/80 dark:bg-gray-700/50 rounded-lg border border-gray-200/50 dark:border-gray-600/50">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-1">{item.title}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDate(item.dueDate)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sign Out - Always at bottom */}
          <div className="mt-auto pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
            <Button 
              onClick={() => signOut({ callbackUrl: '/auth/signin' })} 
              variant="ghost" 
              className={`w-full ${sidebarCollapsed ? 'h-12 w-12 p-0 mx-auto' : 'justify-start'} text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20`}
              title={sidebarCollapsed ? "Sign Out" : ""}
            >
              <LogOut className="w-5 h-5" />
              {!sidebarCollapsed && <span className="ml-3">Sign Out</span>}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`${sidebarCollapsed ? 'lg:ml-28' : 'lg:ml-96'} min-h-screen transition-all duration-300`}>
        {/* Mobile Header */}
        <div className="lg:hidden bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 p-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => setSidebarOpen(true)}
              variant="ghost"
              size="sm"
              className="p-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="font-semibold text-gray-900 dark:text-white">Student Dashboard</h1>
            <div className="w-8 h-8" />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 lg:p-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
              <div className="relative z-10">
                <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                  {getGreeting()}, {session?.user?.name?.split(' ')[0]}! 👋
                </h1>
                <p className="text-blue-100 text-lg mb-4">Welcome to your AI-powered learning portal</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center bg-white/20 px-3 py-1 rounded-full">
                    <GraduationCap className="w-4 h-4 mr-1" />
                    {session?.user?.department}
                  </span>
                  <span className="flex items-center bg-white/20 px-3 py-1 rounded-full">
                    <BookOpen className="w-4 h-4 mr-1" />
                    {session?.user?.year} Year
                  </span>
                  <span className="flex items-center bg-white/20 px-3 py-1 rounded-full">
                    <User className="w-4 h-4 mr-1" />
                    USN: {session?.user?.rollNo}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8 border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('search')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'search'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Search Documents
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'notifications'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Notifications
              </button>
            </nav>
          </div>

          {/* Conditional Content Based on Active Tab */}
          {activeTab === 'search' && (
            <div className="mb-8">
              <DocumentSearch />
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-blue-500" />
                    Your Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {notifications.length > 0 ? (
                      notifications.map((notification: any, index: number) => (
                        <div key={index} className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">{notification.title}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{notification.message}</p>
                            <p className="text-xs text-gray-500">{new Date(notification.created_at).toLocaleDateString()}</p>
                          </div>
                          <Badge variant={notification.type === 'success' ? 'default' : 'secondary'}>
                            {notification.type}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">No notifications</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'overview' && (
          <>

          {/* AI Chatbot Selection */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <Brain className="w-6 h-6 mr-3 text-blue-600" />
              AI Learning Assistants
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card 
                className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 ${
                  selectedChatbot === 'college' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                }`}
                onClick={() => setSelectedChatbot('college')}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <Megaphone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">College Events</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Get college-wide announcements and updates</p>
                    </div>
                    {selectedChatbot === 'college' && (
                      <Badge className="bg-blue-500 text-white">Active</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 ${
                  selectedChatbot === 'department' 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                }`}
                onClick={() => setSelectedChatbot('department')}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Department Events</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Department-specific events and information</p>
                    </div>
                    {selectedChatbot === 'department' && (
                      <Badge className="bg-green-500 text-white">Active</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 ${
                  selectedChatbot === 'student' 
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                }`}
                onClick={() => setSelectedChatbot('student')}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Personal Assistant</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Track assignments, exams, and deadlines</p>
                    </div>
                    {selectedChatbot === 'student' && (
                      <Badge className="bg-purple-500 text-white">Active</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 ${
                  selectedChatbot === 'teacher' 
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-lg' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
                }`}
                onClick={() => setSelectedChatbot('teacher')}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                      <UserCheck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Teacher Connect</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Connect with teachers for academic support</p>
                    </div>
                    {selectedChatbot === 'teacher' && (
                      <Badge className="bg-orange-500 text-white">Active</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chat Interface */}
            {selectedChatbot && (
              <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
                <CardHeader className="pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                      AI Assistant
                      <span className="ml-2 text-sm font-normal text-gray-600 dark:text-gray-400">
                        {selectedChatbot === 'college' && '• College Support'}
                        {selectedChatbot === 'department' && '• Department Support'}
                        {selectedChatbot === 'student' && '• Personal Assistant'}
                        {selectedChatbot === 'teacher' && '• Teacher Connect'}
                      </span>
                    </CardTitle>
                    <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50 dark:bg-green-900/20">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                      Online
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Chat Messages */}
                  <div className="h-96 overflow-y-auto p-6 space-y-4">
                    {chatMessages.length === 0 && (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Brain className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          Hello {session?.user?.name?.split(' ')[0]}! 👋
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          I'm your AI learning assistant. I can help you with:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-md mx-auto text-sm">
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                            <CheckCircle2 className="w-4 h-4 text-blue-600 mb-1" />
                            <p className="text-blue-700 dark:text-blue-400">Event notifications</p>
                          </div>
                          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                            <CheckCircle2 className="w-4 h-4 text-green-600 mb-1" />
                            <p className="text-green-700 dark:text-green-400">Assignment reminders</p>
                          </div>
                          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                            <CheckCircle2 className="w-4 h-4 text-purple-600 mb-1" />
                            <p className="text-purple-700 dark:text-purple-400">Exam schedules</p>
                          </div>
                          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                            <CheckCircle2 className="w-4 h-4 text-orange-600 mb-1" />
                            <p className="text-orange-700 dark:text-orange-400">Academic support</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                          Type a message to get started! You can also use voice input or upload images.
                        </p>
                      </div>
                    )}
                    
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                          msg.sender === 'user' 
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
                        }`}>
                          <p className="text-sm">{msg.text}</p>
                          <p className={`text-xs mt-2 ${msg.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                            {msg.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Chat Input */}
                  <div className="border-t border-gray-200/50 dark:border-gray-700/50 p-4">
                    <div className="flex items-center space-x-3">
                      <Button variant="outline" size="sm" className="shrink-0">
                        <Image className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="shrink-0">
                        <Mic className="w-4 h-4" />
                      </Button>
                      <div className="flex-1 flex">
                        <input
                          type="text"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          placeholder="Type your message..."
                          className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-l-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                        <Button 
                          onClick={sendMessage} 
                          className="rounded-l-none bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                          disabled={!message.trim()}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  )
}


