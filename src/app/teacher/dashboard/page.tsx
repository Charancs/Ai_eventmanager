'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { notificationsApi, systemApi, documentsApi } from '@/lib/api'
import DocumentSearch from '@/components/document-search'
import DocumentUpload from '@/components/document-upload'
import { 
  Users, 
  Calendar, 
  MessageSquare, 
  BookOpen, 
  Plus, 
  GraduationCap, 
  Clock, 
  Bell, 
  LogOut, 
  BarChart,
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
  Home,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  FileText,
  Presentation,
  ClipboardList,
  TrendingUp
} from 'lucide-react'

interface TeacherClass {
  id: string
  name: string
  code: string
  semester: string
  students: number
  schedule: string
}

interface TeacherEvent {
  id: string
  title: string
  type: string
  date: Date
  duration: string
  location: string
  description: string
}

interface ClassAnnouncement {
  id: string
  title: string
  content: string
  classId: string
  className: string
  priority: string
  createdAt: Date
  type: string
}

export default function TeacherDashboard() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [selectedAssistant, setSelectedAssistant] = useState('general')
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<TeacherEvent[]>([])
  const [classAnnouncements, setClassAnnouncements] = useState<ClassAnnouncement[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [notifications, setNotifications] = useState<any[]>([])
  const [systemStats, setSystemStats] = useState<any>({})

  useEffect(() => {
    setMounted(true)
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Mock teacher ID (in real app, get from session)
      const teacherId = 1;
      
      // Fetch notifications from backend
      const notificationsData = await notificationsApi.getUserNotifications(teacherId, { limit: 5 });
      setNotifications(notificationsData.slice(0, 5));

      // Fetch system stats
      const statsData = await systemApi.getStats();
      setSystemStats(statsData);

      // Keep existing API calls
      const teacherResponse = await fetch('/api/teacher?type=classes')
      if (teacherResponse.ok) {
        const teacherData = await teacherResponse.json()
        setTeacherClasses(teacherData.data)
      }

      const eventsResponse = await fetch('/api/teacher?type=events')
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json()
        setUpcomingEvents(eventsData.data?.slice(0, 5) || [])
      }

      const announcementsResponse = await fetch('/api/teacher?type=announcements')
      if (announcementsResponse.ok) {
        const announcementsData = await announcementsResponse.json()
        setClassAnnouncements(announcementsData.data?.slice(0, 5) || [])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const assistants = [
    { id: 'general', name: 'Teaching Assistant', icon: Brain, color: 'from-blue-500 to-purple-600' },
    { id: 'academic', name: 'Curriculum Advisor', icon: BookOpen, color: 'from-green-500 to-blue-600' },
    { id: 'grading', name: 'Grading Helper', icon: FileText, color: 'from-purple-500 to-pink-600' },
    { id: 'analytics', name: 'Class Analytics', icon: Presentation, color: 'from-orange-500 to-red-600' }
  ]

  const sendMessage = async () => {
    if (!newMessage.trim()) return

    const message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'user',
      timestamp: new Date()
    }

    setChatMessages([...chatMessages, message])
    setNewMessage('')

    setTimeout(() => {
      const botResponse = {
        id: (Date.now() + 1).toString(),
        text: `I'm your ${assistants.find(a => a.id === selectedAssistant)?.name}. How can I help you with your teaching tasks today?`,
        sender: 'bot',
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, botResponse])
    }, 1000)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'default'
    }
  }

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-blue-50 dark:from-slate-950 dark:via-green-950 dark:to-blue-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading teacher dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-blue-50 dark:from-slate-950 dark:via-green-950 dark:to-blue-950" suppressHydrationWarning>
      {/* Mobile Menu Button */}
      <Button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        variant="outline"
        size="sm"
        className="fixed top-4 left-4 z-40 lg:hidden bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-white/20 shadow-lg"
      >
        <Menu className="h-4 w-4" />
      </Button>

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
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">Teacher Portal</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{session?.user?.name}</p>
                </div>
              </div>
            )}
            {sidebarCollapsed && (
              <div className="w-full flex flex-col items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg mb-2">
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
              className={`w-full ${sidebarCollapsed ? 'h-12 w-12 p-0 mx-auto' : 'justify-start'} bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700`}
              title={sidebarCollapsed ? "Dashboard" : ""}
            >
              <Home className="w-5 h-5" />
              {!sidebarCollapsed && <span className="ml-3">Dashboard</span>}
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full ${sidebarCollapsed ? 'h-12 w-12 p-0 mx-auto' : 'justify-start'} hover:bg-green-50 dark:hover:bg-green-900/20`}
              title={sidebarCollapsed ? "My Classes" : ""}
            >
              <BookOpen className="w-5 h-5" />
              {!sidebarCollapsed && (
                <>
                  <span className="ml-3">My Classes</span>
                  <Badge variant="secondary" className="ml-auto bg-green-100 text-green-600">{teacherClasses.length}</Badge>
                </>
              )}
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full ${sidebarCollapsed ? 'h-12 w-12 p-0 mx-auto' : 'justify-start'} hover:bg-green-50 dark:hover:bg-green-900/20`}
              title={sidebarCollapsed ? "Students" : ""}
            >
              <Users className="w-5 h-5" />
              {!sidebarCollapsed && (
                <>
                  <span className="ml-3">Students</span>
                  <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-600">
                    {teacherClasses.reduce((total, cls) => total + cls.students, 0)}
                  </Badge>
                </>
              )}
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full ${sidebarCollapsed ? 'h-12 w-12 p-0 mx-auto' : 'justify-start'} hover:bg-green-50 dark:hover:bg-green-900/20`}
              title={sidebarCollapsed ? "Events" : ""}
            >
              <Calendar className="w-5 h-5" />
              {!sidebarCollapsed && (
                <>
                  <span className="ml-3">Events</span>
                  <Badge variant="secondary" className="ml-auto bg-purple-100 text-purple-600">{upcomingEvents.length}</Badge>
                </>
              )}
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full ${sidebarCollapsed ? 'h-12 w-12 p-0 mx-auto' : 'justify-start'} hover:bg-green-50 dark:hover:bg-green-900/20`}
              title={sidebarCollapsed ? "Grading" : ""}
            >
              <ClipboardList className="w-5 h-5" />
              {!sidebarCollapsed && <span className="ml-3">Grading</span>}
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full ${sidebarCollapsed ? 'h-12 w-12 p-0 mx-auto' : 'justify-start'} hover:bg-green-50 dark:hover:bg-green-900/20`}
              title={sidebarCollapsed ? "AI Assistant" : ""}
            >
              <Brain className="w-5 h-5" />
              {!sidebarCollapsed && <span className="ml-3">AI Assistant</span>}
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full ${sidebarCollapsed ? 'h-12 w-12 p-0 mx-auto' : 'justify-start'} hover:bg-green-50 dark:hover:bg-green-900/20`}
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
                    Teaching Overview
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">{teacherClasses.length}</div>
                        <div className="text-xs text-green-500 dark:text-green-400">Classes</div>
                      </div>
                    </Card>
                    <Card className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {teacherClasses.reduce((total, cls) => total + cls.students, 0)}
                        </div>
                        <div className="text-xs text-blue-500 dark:text-blue-400">Students</div>
                      </div>
                    </Card>
                    <Card className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{upcomingEvents.length}</div>
                        <div className="text-xs text-purple-500 dark:text-purple-400">Events</div>
                      </div>
                    </Card>
                    <Card className="p-3 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{classAnnouncements.length}</div>
                        <div className="text-xs text-orange-500 dark:text-orange-400">Announcements</div>
                      </div>
                    </Card>
                  </div>
                </div>

                {/* AI Assistants */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <Brain className="w-4 h-4 mr-2" />
                    Teaching Assistants
                  </h3>
                  <div className="space-y-2">
                    {assistants.map((assistant) => (
                      <Button
                        key={assistant.id}
                        variant={selectedAssistant === assistant.id ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setSelectedAssistant(assistant.id)}
                        className={`w-full justify-start text-xs ${
                          selectedAssistant === assistant.id 
                            ? `bg-gradient-to-r ${assistant.color} text-white` 
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <assistant.icon className="w-4 h-4 mr-2" />
                        {assistant.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sign Out */}
          <div className="mt-auto">
            <Button 
              variant="ghost" 
              className={`w-full ${sidebarCollapsed ? 'h-12 w-12 p-0 mx-auto' : 'justify-start'} text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20`}
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              title={sidebarCollapsed ? "Sign Out" : ""}
            >
              <LogOut className="w-5 h-5" />
              {!sidebarCollapsed && <span className="ml-3">Sign Out</span>}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-28' : 'lg:ml-96'} min-h-screen`}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 pt-16 lg:pt-0">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Teacher Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Welcome back, {session?.user?.name}</p>
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
                onClick={() => setActiveTab('documents')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'documents'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Upload Documents
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
          {activeTab === 'documents' && (
            <div className="mb-8">
              <DocumentUpload />
            </div>
          )}

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

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column */}
            <div className="xl:col-span-2 space-y-6">
              {/* My Classes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-green-500" />
                    My Classes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {teacherClasses.length > 0 ? (
                      teacherClasses.map((cls) => (
                        <div key={cls.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">{cls.name}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{cls.code} • {cls.semester} Semester</p>
                            </div>
                            <Badge variant="secondary" className="bg-green-100 text-green-600">{cls.students} students</Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{cls.schedule}</p>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="text-xs">
                              View Details
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs">
                              Attendance
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-8">
                        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No classes assigned</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Events */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    Upcoming Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingEvents.length > 0 ? (
                      upcomingEvents.map((event) => (
                        <div key={event.id} className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">{event.title}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{event.description}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>{formatDate(event.date)}</span>
                              <span>{event.duration}</span>
                              <span>{event.location}</span>
                            </div>
                          </div>
                          <Badge variant="outline">{event.type}</Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">No upcoming events</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Class Announcements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-purple-500" />
                    Recent Class Announcements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {classAnnouncements.length > 0 ? (
                      classAnnouncements.map((announcement) => (
                        <div key={announcement.id} className="border-l-4 border-purple-500 pl-4 py-2">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">{announcement.title}</h4>
                            <Badge variant={getPriorityColor(announcement.priority)}>{announcement.priority}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{announcement.content}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Class: {announcement.className}</span>
                            <span>{formatDate(announcement.createdAt)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">No class announcements</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - AI Chat */}
            <div className="order-first xl:order-last">
              <Card className="h-[400px] xl:h-[600px] flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm lg:text-base">
                    <Brain className="w-4 h-4 lg:w-5 lg:h-5 text-green-500" />
                    AI {assistants.find(a => a.id === selectedAssistant)?.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0">
                  {/* Assistant Selection */}
                  <div className="px-6 pb-4">
                    <div className="grid grid-cols-2 gap-2">
                      {assistants.map((assistant) => (
                        <Button
                          key={assistant.id}
                          variant={selectedAssistant === assistant.id ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setSelectedAssistant(assistant.id)}
                          className={`text-xs ${
                            selectedAssistant === assistant.id 
                              ? `bg-gradient-to-r ${assistant.color} text-white border-0` 
                              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          <assistant.icon className="w-3 h-3 mr-1" />
                          {assistant.name.split(' ')[0]}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto px-6 space-y-4">
                    {chatMessages.length === 0 && (
                      <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                        <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Start a conversation with your teaching assistant!</p>
                        <p className="text-sm mt-2">Ask about class management, grading, or curriculum advice.</p>
                      </div>
                    )}
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${
                          msg.sender === 'user' 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        }`}>
                          <p className="text-sm">{msg.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Chat Input */}
                  <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Ask your teaching assistant..."
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <Button size="sm" onClick={sendMessage} className="bg-green-500 hover:bg-green-600">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  )
}
