'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { notificationsApi, systemApi, departmentsApi } from '@/lib/api'
import DocumentSearch from '@/components/document-search'
import DocumentUpload from '@/components/document-upload'
import { 
  Users, 
  Calendar, 
  MessageSquare, 
  Building, 
  TrendingUp, 
  Plus, 
  LogOut, 
  BarChart, 
  Bell, 
  Settings,
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
  Clock,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Briefcase,
  Target,
  Activity
} from 'lucide-react'

interface DepartmentStats {
  totalStudents: number
  totalTeachers: number
  activeAnnouncements: number
  upcomingEvents: number
  avgAttendance: string
  placementRate: string
}

interface DepartmentAnnouncement {
  id: string
  title: string
  content: string
  priority: string
  type: string
  createdAt: Date
  createdBy: string
}

interface DepartmentEvent {
  id: string
  title: string
  type: string
  date: Date
  duration: string
  location: string
  description: string
}

export default function DepartmentDashboard() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [selectedAssistant, setSelectedAssistant] = useState('general')
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats>({
    totalStudents: 0,
    totalTeachers: 0,
    activeAnnouncements: 0,
    upcomingEvents: 0,
    avgAttendance: '0%',
    placementRate: '0%'
  })
  const [recentAnnouncements, setRecentAnnouncements] = useState<DepartmentAnnouncement[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<DepartmentEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [notifications, setNotifications] = useState<any[]>([])
  const [systemStats, setSystemStats] = useState<any>({})
  const [departments, setDepartments] = useState<any[]>([])

  useEffect(() => {
    setMounted(true)
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const department = session?.user?.department || 'Computer Science'
      // Mock department ID (in real app, get from session)
      const departmentId = 1;
      
      // Fetch notifications from backend
      const notificationsData = await notificationsApi.getUserNotifications(departmentId, { limit: 5 });
      setNotifications(notificationsData.slice(0, 5));

      // Fetch system stats
      const statsData = await systemApi.getStats();
      setSystemStats(statsData);

      // Fetch departments list
      const departmentsData = await departmentsApi.listDepartments();
      setDepartments(departmentsData.slice(0, 10));
      
      // Keep existing API calls
      const statsResponse = await fetch(`/api/department?type=stats&department=${encodeURIComponent(department)}`)
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setDepartmentStats(statsData.data)
      }

      const announcementsResponse = await fetch(`/api/department?type=announcements&department=${encodeURIComponent(department)}`)
      if (announcementsResponse.ok) {
        const announcementsData = await announcementsResponse.json()
        setRecentAnnouncements(announcementsData.data?.slice(0, 5) || [])
      }

      const eventsResponse = await fetch(`/api/department?type=events&department=${encodeURIComponent(department)}`)
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json()
        setUpcomingEvents(eventsData.data?.slice(0, 5) || [])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const assistants = [
    { id: 'general', name: 'Department Assistant', icon: Brain, color: 'from-orange-500 to-red-600' },
    { id: 'academic', name: 'Academic Advisor', icon: School, color: 'from-blue-500 to-indigo-600' },
    { id: 'analytics', name: 'Performance Analytics', icon: BarChart, color: 'from-purple-500 to-pink-600' },
    { id: 'placement', name: 'Placement Coordinator', icon: Briefcase, color: 'from-green-500 to-teal-600' }
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
        text: `I'm your ${assistants.find(a => a.id === selectedAssistant)?.name}. How can I help you with department management today?`,
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-50 dark:from-slate-950 dark:via-orange-950 dark:to-red-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading department dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-50 dark:from-slate-950 dark:via-orange-950 dark:to-red-950" suppressHydrationWarning>
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
      <div className={`fixed left-4 top-4 bottom-4 ${sidebarCollapsed ? 'w-20' : 'w-80'} bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl shadow-2xl rounded-2xl border border-white/20 dark:border-slate-700/50 z-50 transition-all duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className={`h-full flex flex-col ${sidebarCollapsed ? 'p-4' : 'p-6'}`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">Department Portal</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{session?.user?.name}</p>
                </div>
              </div>
            )}
            {sidebarCollapsed && (
              <div className="w-full flex flex-col items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center shadow-lg mb-2">
                  <Building className="w-6 h-6 text-white" />
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
          <nav className="space-y-2 mb-6">
            <Button 
              variant="default" 
              className={`w-full ${sidebarCollapsed ? 'h-12 w-12 p-0 mx-auto' : 'justify-start'} bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700`}
              title={sidebarCollapsed ? "Dashboard" : ""}
            >
              <Home className="w-5 h-5" />
              {!sidebarCollapsed && <span className="ml-3">Dashboard</span>}
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full ${sidebarCollapsed ? 'h-12 w-12 p-0 mx-auto' : 'justify-start'} hover:bg-orange-50 dark:hover:bg-orange-900/20`}
              title={sidebarCollapsed ? "Students" : ""}
            >
              <GraduationCap className="w-5 h-5" />
              {!sidebarCollapsed && (
                <>
                  <span className="ml-3">Students</span>
                  <Badge variant="secondary" className="ml-auto bg-orange-100 text-orange-600">{departmentStats.totalStudents}</Badge>
                </>
              )}
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full ${sidebarCollapsed ? 'h-12 w-12 p-0 mx-auto' : 'justify-start'} hover:bg-orange-50 dark:hover:bg-orange-900/20`}
              title={sidebarCollapsed ? "Faculty" : ""}
            >
              <Users className="w-5 h-5" />
              {!sidebarCollapsed && (
                <>
                  <span className="ml-3">Faculty</span>
                  <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-600">{departmentStats.totalTeachers}</Badge>
                </>
              )}
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full ${sidebarCollapsed ? 'h-12 w-12 p-0 mx-auto' : 'justify-start'} hover:bg-orange-50 dark:hover:bg-orange-900/20`}
              title={sidebarCollapsed ? "Announcements" : ""}
            >
              <Megaphone className="w-5 h-5" />
              {!sidebarCollapsed && (
                <>
                  <span className="ml-3">Announcements</span>
                  <Badge variant="secondary" className="ml-auto bg-purple-100 text-purple-600">{departmentStats.activeAnnouncements}</Badge>
                </>
              )}
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full ${sidebarCollapsed ? 'h-12 w-12 p-0 mx-auto' : 'justify-start'} hover:bg-orange-50 dark:hover:bg-orange-900/20`}
              title={sidebarCollapsed ? "Analytics" : ""}
            >
              <BarChart className="w-5 h-5" />
              {!sidebarCollapsed && <span className="ml-3">Analytics</span>}
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full ${sidebarCollapsed ? 'h-12 w-12 p-0 mx-auto' : 'justify-start'} hover:bg-orange-50 dark:hover:bg-orange-900/20`}
              title={sidebarCollapsed ? "Placements" : ""}
            >
              <Briefcase className="w-5 h-5" />
              {!sidebarCollapsed && <span className="ml-3">Placements</span>}
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full ${sidebarCollapsed ? 'h-12 w-12 p-0 mx-auto' : 'justify-start'} hover:bg-orange-50 dark:hover:bg-orange-900/20`}
              title={sidebarCollapsed ? "AI Assistant" : ""}
            >
              <Brain className="w-5 h-5" />
              {!sidebarCollapsed && <span className="ml-3">AI Assistant</span>}
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full ${sidebarCollapsed ? 'h-12 w-12 p-0 mx-auto' : 'justify-start'} hover:bg-orange-50 dark:hover:bg-orange-900/20`}
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
                  Department Overview
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Card className="p-3 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{departmentStats.totalStudents}</div>
                      <div className="text-xs text-orange-500 dark:text-orange-400">Students</div>
                    </div>
                  </Card>
                  <Card className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{departmentStats.totalTeachers}</div>
                      <div className="text-xs text-blue-500 dark:text-blue-400">Faculty</div>
                    </div>
                  </Card>
                  <Card className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">{departmentStats.avgAttendance}</div>
                      <div className="text-xs text-green-500 dark:text-green-400">Attendance</div>
                    </div>
                  </Card>
                  <Card className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{departmentStats.placementRate}</div>
                      <div className="text-xs text-purple-500 dark:text-purple-400">Placements</div>
                    </div>
                  </Card>
                </div>
              </div>

              {/* AI Assistants */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <Brain className="w-4 h-4 mr-2" />
                  Department Assistants
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
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-28' : 'ml-96'} mr-8 py-8`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Department Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Welcome back, {session?.user?.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">{session?.user?.department || 'Computer Science'} Department</p>
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
                onClick={() => setActiveTab('departments')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'departments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Departments
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

          {activeTab === 'departments' && (
            <div className="mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-blue-500" />
                    All Departments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {departments.length > 0 ? (
                      departments.map((dept: any, index: number) => (
                        <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <h4 className="font-medium text-gray-900 dark:text-white">{dept.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{dept.description}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <Badge variant="outline">{dept.code}</Badge>
                            <span className="text-xs text-gray-500">{dept.head_name}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4 col-span-full">No departments data</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'overview' && (
          <>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Total Students</p>
                    <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">{departmentStats.totalStudents.toLocaleString()}</p>
                  </div>
                  <GraduationCap className="h-12 w-12 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Faculty Members</p>
                    <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{departmentStats.totalTeachers}</p>
                  </div>
                  <Users className="h-12 w-12 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Avg Attendance</p>
                    <p className="text-3xl font-bold text-green-700 dark:text-green-300">{departmentStats.avgAttendance}</p>
                  </div>
                  <Activity className="h-12 w-12 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Placement Rate</p>
                    <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{departmentStats.placementRate}</p>
                  </div>
                  <Target className="h-12 w-12 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Department Announcements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-orange-500" />
                    Department Announcements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentAnnouncements.length > 0 ? (
                      recentAnnouncements.map((announcement) => (
                        <div key={announcement.id} className="border-l-4 border-orange-500 pl-4 py-2">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">{announcement.title}</h4>
                            <Badge variant={getPriorityColor(announcement.priority)}>{announcement.priority}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{announcement.content}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>By {announcement.createdBy}</span>
                            <span>{formatDate(announcement.createdAt)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">No department announcements</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Events */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    Upcoming Department Events
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

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart className="w-5 h-5 text-purple-500" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Student Attendance</span>
                          <span className="font-medium">{departmentStats.avgAttendance}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: departmentStats.avgAttendance }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Placement Rate</span>
                          <span className="font-medium">{departmentStats.placementRate}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full" 
                            style={{ width: departmentStats.placementRate }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {Math.round(departmentStats.totalStudents / departmentStats.totalTeachers)}:1
                        </div>
                        <div className="text-sm text-blue-500 dark:text-blue-400">Student-Faculty Ratio</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{departmentStats.upcomingEvents}</div>
                        <div className="text-sm text-green-500 dark:text-green-400">Upcoming Events</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - AI Chat */}
            <div>
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-orange-500" />
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
                        <p>Start a conversation with your department assistant!</p>
                        <p className="text-sm mt-2">Ask about department analytics, performance metrics, or administrative tasks.</p>
                      </div>
                    )}
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${
                          msg.sender === 'user' 
                            ? 'bg-orange-500 text-white' 
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
                        placeholder="Ask your department assistant..."
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <Button size="sm" onClick={sendMessage} className="bg-orange-500 hover:bg-orange-600">
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
