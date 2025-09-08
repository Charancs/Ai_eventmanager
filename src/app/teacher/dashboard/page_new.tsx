'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  Bell, 
  BookOpen, 
  GraduationCap, 
  LogOut, 
  Clock,
  MessageSquare,
  ChevronRight,
  Star,
  TrendingUp,
  Target,
  Award,
  FileText,
  Users,
  PlusIcon,
  X,
  Sun,
  Moon,
  Menu,
  Home,
  Settings,
  BarChart3,
  Brain,
  Zap,
  CheckCircle2,
  AlertCircle,
  Mic,
  Image,
  Send,
  School,
  UserCheck,
  Megaphone,
  Plus,
  Building,
  Shield
} from 'lucide-react'

interface ClassAnnouncement {
  id: string
  title: string
  content: string
  createdAt: string
  priority: string
}

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
  priority: string
  createdAt: string
}

export default function TeacherDashboard() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [classAnnouncements, setClassAnnouncements] = useState<ClassAnnouncement[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedChatbot, setSelectedChatbot] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch teacher's announcements
      const announcementsResponse = await fetch('/api/announcements/teacher')
      if (announcementsResponse.ok) {
        const announcementsData = await announcementsResponse.json()
        setClassAnnouncements(announcementsData.slice(0, 5))
      }

      // Fetch upcoming events
      const eventsResponse = await fetch('/api/events/teacher')
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json()
        setUpcomingEvents(eventsData.slice(0, 5))
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toUpperCase()) {
      case 'URGENT': return 'bg-red-500'
      case 'HIGH': return 'bg-orange-500'
      case 'MEDIUM': return 'bg-blue-500'
      case 'LOW': return 'bg-green-500'
      default: return 'bg-gray-500'
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
        'class': "I'll help you manage your classes and student announcements. What would you like to do?",
        'department': "I can assist you with department coordination and administrative tasks. How can I help?",
        'student': "I'm here to help you support your students and track their progress. What do you need?",
        'admin': "I'll help you with administrative tasks and college-wide coordination. What's on your mind?"
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex" suppressHydrationWarning>
      {/* Floating Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 shadow-xl rounded-r-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">Teacher Portal</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{session?.user?.name}</p>
            </div>
          </div>
          <Button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            variant="ghost"
            size="sm"
          >
            {mounted && theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          <Button variant="default" className="w-full justify-start">
            <Home className="w-4 h-4 mr-3" />
            Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Calendar className="w-4 h-4 mr-3" />
            Calendar
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <BookOpen className="w-4 h-4 mr-3" />
            Classes
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Users className="w-4 h-4 mr-3" />
            Students
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="w-4 h-4 mr-3" />
            Settings
          </Button>
        </nav>

        {/* Quick Overview */}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Quick Overview</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <Users className="w-4 h-4 text-green-600" />
                <span className="text-xl font-bold text-green-600">120</span>
              </div>
              <p className="text-xs text-green-600 mt-1">Students</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span className="text-xl font-bold text-blue-600">5</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">Classes</p>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Upcoming Events
            </h3>
            <span className="text-sm text-gray-500">{upcomingEvents.length}</span>
          </div>
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No upcoming events</p>
              <Button className="mt-3" size="sm">
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Event
              </Button>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {upcomingEvents.map((event, index) => (
                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">{event.title}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDate(event.date)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Announcements */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
              <Bell className="w-4 h-4 mr-2" />
              My Announcements
            </h3>
            <span className="text-sm text-gray-500">{classAnnouncements.length}</span>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {classAnnouncements.map((announcement) => (
              <div key={announcement.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Badge className={announcement.priority === 'HIGH' ? 'bg-orange-500' : announcement.priority === 'MEDIUM' ? 'bg-blue-500' : 'bg-green-500'}>
                      {announcement.priority}
                    </Badge>
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm mt-1">{announcement.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDate(announcement.createdAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sign Out */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button 
            onClick={() => signOut()} 
            variant="ghost" 
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {getGreeting()}, Professor {session?.user?.name?.split(' ')[0]}! 👨‍🏫
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 flex items-center space-x-6">
              <span className="flex items-center">
                <Building className="w-4 h-4 mr-1" />
                {session?.user?.department} Department
              </span>
              <span className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                120 Students
              </span>
              <span className="flex items-center">
                <BookOpen className="w-4 h-4 mr-1" />
                5 Classes
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">TEACHER</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 dark:text-green-400 font-medium">Total Students</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300">120</p>
                  <p className="text-sm text-green-600/80 dark:text-green-400/80 mt-1">Active enrollment</p>
                </div>
                <Users className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 dark:text-blue-400 font-medium">Classes</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">5</p>
                  <p className="text-sm text-blue-600/80 dark:text-blue-400/80 mt-1">This semester</p>
                </div>
                <BookOpen className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 dark:text-purple-400 font-medium">Announcements</p>
                  <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{classAnnouncements.length}</p>
                  <p className="text-sm text-purple-600/80 dark:text-purple-400/80 mt-1">Posted this week</p>
                </div>
                <MessageSquare className="w-12 h-12 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 dark:text-orange-400 font-medium">AI Interactions</p>
                  <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">42</p>
                  <p className="text-sm text-orange-600/80 dark:text-orange-400/80 mt-1">This week</p>
                </div>
                <Brain className="w-12 h-12 text-orange-600 dark:text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Teaching Assistant */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <Brain className="w-5 h-5 mr-2" />
              AI Teaching Assistant
            </h2>
            <Badge variant="outline" className="text-green-600 border-green-600">
              <Zap className="w-3 h-3 mr-1" />
              Smart
            </Badge>
          </div>
          
          {/* Chatbot Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card 
              className={`cursor-pointer transition-all hover:shadow-lg ${selectedChatbot === 'class' ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20' : ''}`}
              onClick={() => setSelectedChatbot('class')}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <BookOpen className="w-8 h-8 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Class Management</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Manage your classes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-lg ${selectedChatbot === 'department' ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}
              onClick={() => setSelectedChatbot('department')}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Building className="w-8 h-8 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Department Support</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Coordinate activities</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-lg ${selectedChatbot === 'student' ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/20' : ''}`}
              onClick={() => setSelectedChatbot('student')}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Users className="w-8 h-8 text-purple-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Student Support</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Help your students</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-lg ${selectedChatbot === 'admin' ? 'ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-900/20' : ''}`}
              onClick={() => setSelectedChatbot('admin')}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Shield className="w-8 h-8 text-orange-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Admin Connect</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Administrative tasks</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          {selectedChatbot && (
            <Card className="h-96">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    AI Teaching Assistant
                    <span className="ml-2 text-sm font-normal text-gray-600 dark:text-gray-400">
                      {selectedChatbot === 'class' && 'Class Support'}
                      {selectedChatbot === 'department' && 'Department Support'}
                      {selectedChatbot === 'student' && 'Student Support'}
                      {selectedChatbot === 'admin' && 'Admin Support'}
                    </span>
                  </CardTitle>
                  <Badge variant="outline" className="text-green-600 border-green-600">Online</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col h-72">
                {/* Chat Messages */}
                <div className="flex-1 space-y-4 overflow-y-auto mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {chatMessages.length === 0 && (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Brain className="w-6 h-6 text-green-600" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">
                        Hello Professor {session?.user?.name?.split(' ')[0]}! I'm your AI teaching assistant. I can help you with:
                      </p>
                      <ul className="mt-3 text-sm text-gray-500 dark:text-gray-400 space-y-1">
                        <li>• Class management and announcements</li>
                        <li>• Student progress tracking</li>
                        <li>• Department coordination</li>
                        <li>• Administrative tasks</li>
                      </ul>
                      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                        You can send text messages, images, or use voice input. How can I help you today?
                      </p>
                      <p className="text-xs text-gray-500 mt-2">06:23 pm</p>
                    </div>
                  )}
                  
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.sender === 'user' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border'
                      }`}>
                        <p className="text-sm">{msg.text}</p>
                        <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-green-100' : 'text-gray-500'}`}>
                          {msg.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Image className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Mic className="w-4 h-4" />
                  </Button>
                  <div className="flex-1 flex">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <Button onClick={sendMessage} className="rounded-l-none bg-green-600 hover:bg-green-700">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
