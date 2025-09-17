'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import DocumentUpload from '@/components/document-upload'
import DocumentSearch from '@/components/document-search'
import { 
  Users, 
  Calendar, 
  Bell, 
  Server, 
  Settings, 
  Database, 
  Shield, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  LogOut, 
  BarChart,
  Brain,
  School,
  Megaphone,
  Sun,
  Moon,
  Menu,
  X,
  Home,
  User,
  ChevronLeft,
  ChevronRight,
  Send,
  Mic,
  Image,
  Building,
  Activity,
  Upload,
  Search
} from 'lucide-react'

interface AdminStats {
  totalStudents: number
  totalTeachers: number
  totalDepartments: number
  activeAnnouncements: number
  totalEvents: number
  pendingApprovals: number
  systemHealth: string
  storageUsed: string
}

interface SystemAlert {
  id: string
  type: string
  title: string
  message: string
  priority: string
  timestamp: Date
  resolved: boolean
}

interface Announcement {
  id: string
  title: string
  content: string
  type: string
  priority: string
  createdAt: Date
  createdBy: string
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [selectedAssistant, setSelectedAssistant] = useState('general')
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [adminStats, setAdminStats] = useState<AdminStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalDepartments: 0,
    activeAnnouncements: 0,
    totalEvents: 0,
    pendingApprovals: 0,
    systemHealth: 'Good',
    storageUsed: '0%'
  })
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    setMounted(true)
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Use backend API for system stats
      const statsResponse = await fetch('http://localhost:8000/api/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setAdminStats({
          totalStudents: statsData.users.students,
          totalTeachers: statsData.users.teachers,
          totalDepartments: statsData.departments,
          activeAnnouncements: 0, // Will be updated when announcements API is ready
          totalEvents: statsData.events,
          pendingApprovals: statsData.notifications.pending,
          systemHealth: 'Good',
          storageUsed: '12%' // This would come from actual storage monitoring
        })
      }

      // Mock system alerts for now
      setSystemAlerts([
        {
          id: '1',
          type: 'info',
          title: 'System Update',
          message: 'Backend services are running smoothly',
          priority: 'low',
          timestamp: new Date(),
          resolved: false
        }
      ])

      // Get documents as announcements proxy
      const documentsResponse = await fetch('http://localhost:8000/api/documents/documents?limit=5')
      if (documentsResponse.ok) {
        const documentsData = await documentsResponse.json()
        const mockAnnouncements = documentsData.documents?.map((doc: any) => ({
          id: doc.id.toString(),
          title: doc.title,
          content: `Document uploaded: ${doc.filename}`,
          type: doc.document_type,
          priority: 'medium',
          createdAt: new Date(doc.created_at),
          createdBy: 'System'
        })) || []
        setAnnouncements(mockAnnouncements)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Fallback to mock data
      setAdminStats({
        totalStudents: 245,
        totalTeachers: 18,
        totalDepartments: 5,
        activeAnnouncements: 12,
        totalEvents: 8,
        pendingApprovals: 3,
        systemHealth: 'Good',
        storageUsed: '12%'
      })
    } finally {
      setLoading(false)
    }
  }

  const assistants = [
    { id: 'general', name: 'General Assistant', icon: Brain, color: 'from-purple-500 to-pink-600' },
    { id: 'academic', name: 'Academic Advisor', icon: School, color: 'from-blue-500 to-indigo-600' },
    { id: 'system', name: 'System Admin', icon: Server, color: 'from-green-500 to-teal-600' },
    { id: 'analytics', name: 'Analytics Expert', icon: BarChart, color: 'from-orange-500 to-red-600' }
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
        text: `I'm the ${assistants.find(a => a.id === selectedAssistant)?.name}. How can I help you with admin tasks today?`,
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

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-500'
      case 'warning': return 'text-yellow-500'
      case 'info': return 'text-blue-500'
      default: return 'text-gray-500'
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 dark:from-slate-950 dark:via-purple-950 dark:to-indigo-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 dark:from-slate-950 dark:via-purple-950 dark:to-indigo-950" suppressHydrationWarning>
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
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">Admin Portal</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{session?.user?.name}</p>
                </div>
              </div>
            )}
            {sidebarCollapsed && (
              <div className="w-full flex flex-col items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg mb-2">
                  <Shield className="w-6 h-6 text-white" />
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
              variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('dashboard')}
              className={`w-full ${sidebarCollapsed ? 'h-12 w-12 p-0 mx-auto' : 'justify-start'} ${activeTab === 'dashboard' ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' : 'hover:bg-purple-50 dark:hover:bg-purple-900/20'}`}
              title={sidebarCollapsed ? "Dashboard" : ""}
            >
              <Home className="w-5 h-5" />
              {!sidebarCollapsed && <span className="ml-3">Dashboard</span>}
            </Button>
            
            <Button 
              variant={activeTab === 'upload' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('upload')}
              className={`w-full ${sidebarCollapsed ? 'h-12 w-12 p-0 mx-auto' : 'justify-start'} ${activeTab === 'upload' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' : 'hover:bg-purple-50 dark:hover:bg-purple-900/20'}`}
              title={sidebarCollapsed ? "Upload Documents" : ""}
            >
              <Upload className="w-5 h-5" />
              {!sidebarCollapsed && <span className="ml-3">Upload Documents</span>}
            </Button>
            
            <Button 
              variant={activeTab === 'search' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('search')}
              className={`w-full ${sidebarCollapsed ? 'h-12 w-12 p-0 mx-auto' : 'justify-start'} ${activeTab === 'search' ? 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700' : 'hover:bg-purple-50 dark:hover:bg-purple-900/20'}`}
              title={sidebarCollapsed ? "Search Documents" : ""}
            >
              <Search className="w-5 h-5" />
              {!sidebarCollapsed && <span className="ml-3">Search Documents</span>}
            </Button>
            
            <Button 
              variant={activeTab === 'users' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('users')}
              className={`w-full ${sidebarCollapsed ? 'h-12 w-12 p-0 mx-auto' : 'justify-start'} ${activeTab === 'users' ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700' : 'hover:bg-purple-50 dark:hover:bg-purple-900/20'}`}
              title={sidebarCollapsed ? "Users" : ""}
            >
              <Users className="w-5 h-5" />
              {!sidebarCollapsed && (
                <>
                  <span className="ml-3">User Management</span>
                  <Badge variant="secondary" className="ml-auto bg-purple-100 text-purple-600">{adminStats.totalStudents + adminStats.totalTeachers}</Badge>
                </>
              )}
            </Button>
            
            <Button 
              variant={activeTab === 'announcements' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('announcements')}
              className={`w-full ${sidebarCollapsed ? 'h-12 w-12 p-0 mx-auto' : 'justify-start'} ${activeTab === 'announcements' ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' : 'hover:bg-purple-50 dark:hover:bg-purple-900/20'}`}
              title={sidebarCollapsed ? "Announcements" : ""}
            >
              <Megaphone className="w-5 h-5" />
              {!sidebarCollapsed && (
                <>
                  <span className="ml-3">Announcements</span>
                  <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-600">{adminStats.activeAnnouncements}</Badge>
                </>
              )}
            </Button>
            
            <Button 
              variant={activeTab === 'system' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('system')}
              className={`w-full ${sidebarCollapsed ? 'h-12 w-12 p-0 mx-auto' : 'justify-start'} ${activeTab === 'system' ? 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700' : 'hover:bg-purple-50 dark:hover:bg-purple-900/20'}`}
              title={sidebarCollapsed ? "System Monitor" : ""}
            >
              <Activity className="w-5 h-5" />
              {!sidebarCollapsed && (
                <>
                  <span className="ml-3">System Monitor</span>
                  <Badge variant="secondary" className="ml-auto bg-green-100 text-green-600">{adminStats.systemHealth}</Badge>
                </>
              )}
            </Button>
            
            <Button 
              variant={activeTab === 'assistant' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('assistant')}
              className={`w-full ${sidebarCollapsed ? 'h-12 w-12 p-0 mx-auto' : 'justify-start'} ${activeTab === 'assistant' ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700' : 'hover:bg-purple-50 dark:hover:bg-purple-900/20'}`}
              title={sidebarCollapsed ? "AI Assistant" : ""}
            >
              <Brain className="w-5 h-5" />
              {!sidebarCollapsed && <span className="ml-3">AI Assistant</span>}
            </Button>
            
            <Button 
              variant={activeTab === 'settings' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('settings')}
              className={`w-full ${sidebarCollapsed ? 'h-12 w-12 p-0 mx-auto' : 'justify-start'} ${activeTab === 'settings' ? 'bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700' : 'hover:bg-purple-50 dark:hover:bg-purple-900/20'}`}
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
                    <BarChart className="w-4 h-4 mr-2" />
                    System Overview
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{adminStats.totalStudents}</div>
                        <div className="text-xs text-blue-500 dark:text-blue-400">Students</div>
                      </div>
                    </Card>
                    <Card className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">{adminStats.totalTeachers}</div>
                        <div className="text-xs text-green-500 dark:text-green-400">Teachers</div>
                      </div>
                    </Card>
                    <Card className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{adminStats.totalDepartments}</div>
                        <div className="text-xs text-purple-500 dark:text-purple-400">Departments</div>
                      </div>
                    </Card>
                    <Card className="p-3 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{adminStats.pendingApprovals}</div>
                        <div className="text-xs text-orange-500 dark:text-orange-400">Pending</div>
                      </div>
                    </Card>
                  </div>
                </div>

                {/* AI Assistants */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <Brain className="w-4 h-4 mr-2" />
                    AI Assistants
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
          </div>          {/* Sign Out */}
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
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Welcome back, System Administrator</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-blue-600 dark:text-blue-400">Total Students</p>
                    <p className="text-xl lg:text-3xl font-bold text-blue-700 dark:text-blue-300">{adminStats.totalStudents.toLocaleString()}</p>
                  </div>
                  <Users className="h-8 w-8 lg:h-12 lg:w-12 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-green-600 dark:text-green-400">Total Teachers</p>
                    <p className="text-xl lg:text-3xl font-bold text-green-700 dark:text-green-300">{adminStats.totalTeachers}</p>
                  </div>
                  <School className="h-8 w-8 lg:h-12 lg:w-12 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-purple-600 dark:text-purple-400">Departments</p>
                    <p className="text-xl lg:text-3xl font-bold text-purple-700 dark:text-purple-300">{adminStats.totalDepartments}</p>
                  </div>
                  <Building className="h-8 w-8 lg:h-12 lg:w-12 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-orange-600 dark:text-orange-400">Pending Approvals</p>
                    <p className="text-xl lg:text-3xl font-bold text-orange-700 dark:text-orange-300">{adminStats.pendingApprovals}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 lg:h-12 lg:w-12 text-orange-500" />
                </div>
              </CardContent>
            </Card>
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

          {activeTab === 'overview' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column */}
            <div className="xl:col-span-2 space-y-6">
              {/* System Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    System Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {systemAlerts.length > 0 ? (
                      systemAlerts.map((alert) => (
                        <div key={alert.id} className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`w-2 h-2 rounded-full ${getAlertColor(alert.type).replace('text-', 'bg-')}`} />
                              <h4 className="font-medium text-gray-900 dark:text-white">{alert.title}</h4>
                              <Badge variant={getPriorityColor(alert.priority)}>{alert.priority}</Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{alert.message}</p>
                            <p className="text-xs text-gray-500">{formatDate(alert.timestamp)}</p>
                          </div>
                          {alert.resolved ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 mt-1" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-yellow-500 mt-1" />
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">No system alerts</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Announcements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-blue-500" />
                    Recent Announcements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {announcements.length > 0 ? (
                      announcements.map((announcement) => (
                        <div key={announcement.id} className="border-l-4 border-blue-500 pl-4 py-2">
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
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">No announcements</p>
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
                    <Brain className="w-4 h-4 lg:w-5 lg:h-5 text-purple-500" />
                    AI {assistants.find(a => a.id === selectedAssistant)?.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0">
                  {/* Assistant Selection */}
                  <div className="px-4 lg:px-6 pb-4">
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
                          <span className="hidden sm:inline">{assistant.name.split(' ')[0]}</span>
                          <span className="sm:hidden">{assistant.name.split(' ')[0].slice(0, 3)}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto px-4 lg:px-6 space-y-4">
                    {chatMessages.length === 0 && (
                      <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                        <Brain className="w-8 h-8 lg:w-12 lg:h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-sm lg:text-base">Start a conversation with your AI assistant!</p>
                        <p className="text-xs lg:text-sm mt-2">Ask about system management, analytics, or administration.</p>
                      </div>
                    )}
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${
                          msg.sender === 'user' 
                            ? 'bg-purple-500 text-white' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        }`}>
                          <p className="text-xs lg:text-sm">{msg.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Chat Input */}
                  <div className="p-4 lg:p-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Ask your AI assistant..."
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <Button size="sm" onClick={sendMessage} className="bg-purple-500 hover:bg-purple-600">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  )
}
