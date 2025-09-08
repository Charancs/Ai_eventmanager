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
  Presentation
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [selectedAssistant, setSelectedAssistant] = useState('general')
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<TeacherEvent[]>([])
  const [classAnnouncements, setClassAnnouncements] = useState<ClassAnnouncement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading teacher dashboard...</div>
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
                <BookOpen className="h-5 w-5" />
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
          {/* Left Column - Classes and Events */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-2">
                Teacher Dashboard
              </h1>
              <p className="text-gray-300">Welcome back, {session?.user?.name || 'Professor'}</p>
            </div>

            {/* Classes Grid */}
            <Card className="bg-black/40 backdrop-blur-xl border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-400" />
                  My Classes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {teacherClasses.map((cls) => (
                    <div key={cls.id} className="p-4 rounded-lg bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/20">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-white">{cls.name}</h4>
                          <p className="text-sm text-blue-200">{cls.code} • {cls.semester} Semester</p>
                        </div>
                        <Badge variant="secondary">{cls.students} students</Badge>
                      </div>
                      <p className="text-sm text-gray-300">{cls.schedule}</p>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="ghost" className="text-xs bg-white/10 hover:bg-white/20">
                          View Details
                        </Button>
                        <Button size="sm" variant="ghost" className="text-xs bg-white/10 hover:bg-white/20">
                          Attendance
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card className="bg-black/40 backdrop-blur-xl border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-400" />
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-blue-500/20">
                        {event.type === 'exam' && <FileText className="h-4 w-4 text-green-400" />}
                        {event.type === 'meeting' && <Users className="h-4 w-4 text-blue-400" />}
                        {event.type === 'workshop' && <Presentation className="h-4 w-4 text-purple-400" />}
                        {event.type === 'review' && <CheckCircle2 className="h-4 w-4 text-orange-400" />}
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

            {/* Class Announcements */}
            <Card className="bg-black/40 backdrop-blur-xl border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-purple-400" />
                  My Class Announcements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {classAnnouncements.map((announcement) => (
                    <div key={announcement.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-white">{announcement.title}</h4>
                          <p className="text-sm text-blue-200 mt-1">{announcement.className}</p>
                          <p className="text-sm text-gray-300 mt-2">{announcement.content}</p>
                          <p className="text-xs text-gray-400 mt-2">{formatDate(announcement.createdAt)}</p>
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
                <CardTitle className="text-lg font-semibold text-white">AI Teaching Assistant</CardTitle>
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
                      <p>Start a conversation with your teaching assistant</p>
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
                    placeholder="Ask your teaching assistant..."
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
