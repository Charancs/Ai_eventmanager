'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  Target
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

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const department = session?.user?.department || 'Computer Science'
      
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
    { id: 'general', name: 'Department Assistant', icon: Brain, color: 'from-blue-500 to-purple-600' },
    { id: 'academic', name: 'Academic Advisor', icon: School, color: 'from-green-500 to-blue-600' },
    { id: 'analytics', name: 'Performance Analytics', icon: BarChart, color: 'from-purple-500 to-pink-600' },
    { id: 'placement', name: 'Placement Coordinator', icon: Briefcase, color: 'from-orange-500 to-red-600' }
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading department dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/30 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 right-1/3 w-60 h-60 bg-pink-500/20 rounded-full blur-xl animate-pulse delay-2000"></div>
      </div>

      {/* Floating Sidebar */}
      <div className={`fixed left-4 top-4 bottom-4 z-50 transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-20'
      }`}>
        <Card className="h-full bg-black/40 backdrop-blur-xl border-white/20 shadow-2xl">
          <CardContent className="p-4 h-full flex flex-col">
            {/* Toggle Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="mb-4 p-2 h-12 w-12 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200"
            >
              {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </Button>

            {/* Navigation Icons */}
            <div className="flex-1 space-y-3">
              <Button variant="ghost" size="sm" className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200">
                <Home className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200">
                <Building className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200">
                <Users className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200">
                <Calendar className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200">
                <BarChart className="h-5 w-5" />
              </Button>
            </div>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="mb-3 w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* Sign Out */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="w-12 h-12 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-all duration-200"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-24' : 'ml-28'} mr-4 py-4`}>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Stats and Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-2">
                Department Dashboard
              </h1>
              <p className="text-gray-300">
                {session?.user?.department || 'Computer Science'} Department • {session?.user?.name || 'Administrator'}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-xl border-white/20 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-200 text-sm font-medium">Students</p>
                      <p className="text-3xl font-bold text-white">{departmentStats.totalStudents.toLocaleString()}</p>
                    </div>
                    <GraduationCap className="h-8 w-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-600/20 to-blue-600/20 backdrop-blur-xl border-white/20 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-200 text-sm font-medium">Faculty</p>
                      <p className="text-3xl font-bold text-white">{departmentStats.totalTeachers}</p>
                    </div>
                    <UserCheck className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl border-white/20 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-200 text-sm font-medium">Attendance</p>
                      <p className="text-3xl font-bold text-white">{departmentStats.avgAttendance}</p>
                    </div>
                    <Target className="h-8 w-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-600/20 to-red-600/20 backdrop-blur-xl border-white/20 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-200 text-sm font-medium">Placement Rate</p>
                      <p className="text-3xl font-bold text-white">{departmentStats.placementRate}</p>
                    </div>
                    <Briefcase className="h-8 w-8 text-orange-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 backdrop-blur-xl border-white/20 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-cyan-200 text-sm font-medium">Active Announcements</p>
                      <p className="text-3xl font-bold text-white">{departmentStats.activeAnnouncements}</p>
                    </div>
                    <Megaphone className="h-8 w-8 text-cyan-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-pink-600/20 to-purple-600/20 backdrop-blur-xl border-white/20 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-pink-200 text-sm font-medium">Upcoming Events</p>
                      <p className="text-3xl font-bold text-white">{departmentStats.upcomingEvents}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-pink-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Events */}
            <Card className="bg-black/40 backdrop-blur-xl border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-400" />
                  Upcoming Department Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-blue-500/20">
                        {event.type === 'conference' && <Users className="h-4 w-4 text-green-400" />}
                        {event.type === 'competition' && <Target className="h-4 w-4 text-blue-400" />}
                        {event.type === 'exhibition' && <Building className="h-4 w-4 text-purple-400" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{event.title}</h4>
                        <p className="text-sm text-gray-300 mt-1">{event.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span>{formatDate(event.date)}</span>
                          <span>{event.duration}</span>
                          <span>{event.location}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {event.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Department Announcements */}
            <Card className="bg-black/40 backdrop-blur-xl border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-purple-400" />
                  Department Announcements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentAnnouncements.map((announcement) => (
                    <div key={announcement.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-white">{announcement.title}</h4>
                          <p className="text-sm text-gray-300 mt-1">{announcement.content}</p>
                          <p className="text-xs text-gray-400 mt-2">By {announcement.createdBy} • {formatDate(announcement.createdAt)}</p>
                        </div>
                        <Badge variant={getPriorityColor(announcement.priority)}>
                          {announcement.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - AI Chat */}
          <div className="space-y-6">
            {/* AI Assistant Selection */}
            <Card className="bg-black/40 backdrop-blur-xl border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">AI Department Assistant</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 mb-4">
                  {assistants.map((assistant) => (
                    <button
                      key={assistant.id}
                      onClick={() => setSelectedAssistant(assistant.id)}
                      className={`p-3 rounded-lg border transition-all duration-200 text-left ${
                        selectedAssistant === assistant.id
                          ? 'border-white/40 bg-white/10'
                          : 'border-white/20 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${assistant.color}`}>
                          <assistant.icon className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-white font-medium">{assistant.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chat Interface */}
            <Card className="bg-black/40 backdrop-blur-xl border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-400" />
                  Chat with {assistants.find(a => a.id === selectedAssistant)?.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Chat Messages */}
                <div className="h-96 overflow-y-auto mb-4 space-y-3 bg-white/5 rounded-lg p-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-gray-400 mt-20">
                      <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Start a conversation with your department assistant</p>
                    </div>
                  ) : (
                    chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white/10 text-white border border-white/20'
                          }`}
                        >
                          <p className="text-sm">{message.text}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Chat Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Ask your department assistant..."
                    className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    onClick={() => setIsListening(!isListening)}
                    variant="ghost"
                    size="sm"
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      isListening ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={sendMessage}
                    variant="ghost"
                    size="sm"
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
