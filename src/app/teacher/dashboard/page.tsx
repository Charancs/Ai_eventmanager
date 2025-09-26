'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import CollegeEventView from '@/components/college-event-view'
import DepartmentEventView from '@/components/department-event-view'
import SubjectDocumentView from '@/components/subject-document-view'
import SubjectDocumentUpload from '@/components/subject-document-upload'
import AIAssistantHub from '@/components/ai-assistant-hub'
import { 
  Users, 
  GraduationCap, 
  LogOut, 
  Brain,
  Sun,
  Moon,
  Menu,
  X,
  Home,
  ChevronLeft,
  ChevronRight,
  Upload,
  MessageSquare,
  School,
  Building,
  BookOpen
} from 'lucide-react'

interface TeacherStats {
  totalStudents: number
  totalTeachers: number
  totalClasses: number
  totalEvents: number
  systemHealth: string
}

export default function TeacherDashboard() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [teacherStats, setTeacherStats] = useState<TeacherStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalEvents: 0,
    systemHealth: 'Good'
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    setMounted(true)
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Use backend API for basic system stats
      const statsResponse = await fetch('http://localhost:8000/api/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setTeacherStats({
          totalStudents: statsData.users?.students || 420,
          totalTeachers: statsData.users?.teachers || 28,
          totalClasses: 15,
          totalEvents: statsData.events || 12,
          systemHealth: 'Good'
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Keep default stats if API fails
      setTeacherStats({
        totalStudents: 420,
        totalTeachers: 28,
        totalClasses: 15,
        totalEvents: 12,
        systemHealth: 'Good'
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 dark:from-slate-950 dark:via-purple-950 dark:to-indigo-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading teacher dashboard...</p>
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
                variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('dashboard')}
                className={`w-full ${sidebarCollapsed ? 'h-12 w-12 p-0 mx-auto' : 'justify-start'} ${activeTab === 'dashboard' ? 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700' : 'hover:bg-purple-50 dark:hover:bg-purple-900/20'}`}
                title={sidebarCollapsed ? "Dashboard" : ""}
              >
                <Home className="w-5 h-5" />
                {!sidebarCollapsed && <span className="ml-3">Dashboard</span>}
              </Button>
              
              {/* Viewing/Query Section */}
              {!sidebarCollapsed && (
                <div className="pt-4 pb-2">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
                    View & Browse
                  </h4>
                </div>
              )}
              
              <Button 
                variant={activeTab === 'view-college-events' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('view-college-events')}
                className={`w-full ${sidebarCollapsed ? 'h-12 w-12 p-0 mx-auto' : 'justify-start'} ${activeTab === 'view-college-events' ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' : 'hover:bg-purple-50 dark:hover:bg-purple-900/20'}`}
                title={sidebarCollapsed ? "View College Events" : ""}
              >
                <School className="w-5 h-5" />
                {!sidebarCollapsed && <span className="ml-3">View College Events</span>}
              </Button>
              
              <Button 
                variant={activeTab === 'view-dept-events' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('view-dept-events')}
                className={`w-full ${sidebarCollapsed ? 'h-12 w-12 p-0 mx-auto' : 'justify-start'} ${activeTab === 'view-dept-events' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700' : 'hover:bg-purple-50 dark:hover:bg-purple-900/20'}`}
                title={sidebarCollapsed ? "View Department Events" : ""}
              >
                <Building className="w-5 h-5" />
                {!sidebarCollapsed && <span className="ml-3">View Department Events</span>}
              </Button>

              <Button 
                variant={activeTab === 'view-subjects' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('view-subjects')}
                className={`w-full ${sidebarCollapsed ? 'h-12 w-12 p-0 mx-auto' : 'justify-start'} ${activeTab === 'view-subjects' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700' : 'hover:bg-cyan-50 dark:hover:bg-cyan-900/20'}`}
                title={sidebarCollapsed ? "View Subject Documents" : ""}
              >
                <BookOpen className="w-5 h-5" />
                {!sidebarCollapsed && <span className="ml-3">View Subject Documents</span>}
              </Button>

              <Button 
                variant={activeTab === 'chat' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('chat')}
                className={`w-full ${sidebarCollapsed ? 'h-12 w-12 p-0 mx-auto' : 'justify-start'} ${activeTab === 'chat' ? 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700' : 'hover:bg-purple-50 dark:hover:bg-purple-900/20'}`}
                title={sidebarCollapsed ? "AI Assistant" : ""}
              >
                <MessageSquare className="w-5 h-5" />
                {!sidebarCollapsed && <span className="ml-3">AI Assistant</span>}
              </Button>

              {/* Teaching Functions Section */}
              {!sidebarCollapsed && (
                <div className="pt-4 pb-2">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
                    Teaching Functions
                  </h4>
                </div>
              )}
              
              <Button 
                variant={activeTab === 'upload-subjects' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('upload-subjects')}
                className={`w-full ${sidebarCollapsed ? 'h-12 w-12 p-0 mx-auto' : 'justify-start'} ${activeTab === 'upload-subjects' ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700' : 'hover:bg-orange-50 dark:hover:bg-orange-900/20'}`}
                title={sidebarCollapsed ? "Upload Course Documents" : ""}
              >
                <Upload className="w-5 h-5" />
                {!sidebarCollapsed && <span className="ml-3">Upload Course Documents</span>}
              </Button>
            </nav>

            {!sidebarCollapsed && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Teaching Overview
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Card className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{teacherStats.totalStudents}</div>
                      <div className="text-xs text-blue-500 dark:text-blue-400">Students</div>
                    </div>
                  </Card>
                  <Card className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">{teacherStats.totalTeachers}</div>
                      <div className="text-xs text-green-500 dark:text-green-400">Teachers</div>
                    </div>
                  </Card>
                  <Card className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{teacherStats.totalClasses}</div>
                      <div className="text-xs text-purple-500 dark:text-purple-400">Classes</div>
                    </div>
                  </Card>
                  <Card className="p-3 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{teacherStats.totalEvents}</div>
                      <div className="text-xs text-orange-500 dark:text-orange-400">Events</div>
                    </div>
                  </Card>
                </div>
              </div>
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
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 lg:py-8">
          {/* Header */}
          <div className="mb-6 lg:mb-8 pt-16 lg:pt-0">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Teacher Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Welcome back, {session?.user?.name || 'Teacher'}</p>
          </div>

          {/* Tab Content */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs lg:text-sm font-medium text-blue-600 dark:text-blue-400">Total Students</p>
                        <p className="text-xl lg:text-3xl font-bold text-blue-700 dark:text-blue-300">{teacherStats.totalStudents.toLocaleString()}</p>
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
                        <p className="text-xl lg:text-3xl font-bold text-green-700 dark:text-green-300">{teacherStats.totalTeachers}</p>
                      </div>
                      <GraduationCap className="h-8 w-8 lg:h-12 lg:w-12 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs lg:text-sm font-medium text-purple-600 dark:text-purple-400">Total Classes</p>
                        <p className="text-xl lg:text-3xl font-bold text-purple-700 dark:text-purple-300">{teacherStats.totalClasses}</p>
                      </div>
                      <School className="h-8 w-8 lg:h-12 lg:w-12 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs lg:text-sm font-medium text-orange-600 dark:text-orange-400">Total Events</p>
                        <p className="text-xl lg:text-3xl font-bold text-orange-700 dark:text-orange-300">{teacherStats.totalEvents}</p>
                      </div>
                      <Brain className="h-8 w-8 lg:h-12 lg:w-12 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Welcome Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-green-500" />
                    Teacher Functions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-purple-200 dark:border-purple-800 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                      <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">College Events View</h3>
                      <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">View and browse college event documents and announcements (read-only access).</p>
                      <Button 
                        onClick={() => setActiveTab('view-college-events')}
                        size="sm" 
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        View College Events
                      </Button>
                    </div>
                    <div className="p-4 border border-cyan-200 dark:border-cyan-800 rounded-lg bg-cyan-50 dark:bg-cyan-900/20">
                      <h3 className="font-semibold text-cyan-900 dark:text-cyan-100 mb-2">Department Events View</h3>
                      <p className="text-sm text-cyan-700 dark:text-cyan-300 mb-3">View and browse department-specific event documents and announcements.</p>
                      <Button 
                        onClick={() => setActiveTab('view-dept-events')}
                        size="sm" 
                        className="bg-cyan-600 hover:bg-cyan-700"
                      >
                        View Dept Events
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="p-4 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">AI Assistant</h3>
                      <p className="text-sm text-green-700 dark:text-green-300 mb-3">Chat with AI to get answers about college events, department events, and system information.</p>
                      <Button 
                        onClick={() => setActiveTab('chat')}
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Start Chat
                      </Button>
                    </div>
                    <div className="p-4 border border-orange-200 dark:border-orange-800 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                      <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">Course Documents Management</h3>
                      <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">Upload and manage course-specific documents and materials for students.</p>
                      <Button 
                        onClick={() => setActiveTab('upload-subjects')}
                        size="sm" 
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        Upload Course Docs
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'view-college-events' && (
            <div className="space-y-6">
              <CollegeEventView />
            </div>
          )}

          {activeTab === 'view-dept-events' && (
            <div className="space-y-6">
              <DepartmentEventView />
            </div>
          )}

          {activeTab === 'view-subjects' && (
            <div className="space-y-6">
              <SubjectDocumentView />
            </div>
          )}

          {activeTab === 'upload-subjects' && (
            <div className="space-y-6">
              <SubjectDocumentUpload />
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="space-y-6">
              <AIAssistantHub />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
