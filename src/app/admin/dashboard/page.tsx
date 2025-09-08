'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Chatbot } from '@/components/chatbot'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Building, MessageSquare, Settings, TrendingUp, Plus, Shield, X, LogOut, BarChart, Calendar, Bell } from 'lucide-react'

export default function AdminDashboard() {
  const { data: session } = useSession()
  const [collegeStats, setCollegeStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalDepartments: 0,
    activeAnnouncements: 0
  })
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([])
  const [systemAlerts, setSystemAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch college-wide statistics
      const statsResponse = await fetch('/api/admin/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setCollegeStats(statsData)
      }

      // Fetch recent college announcements
      const announcementsResponse = await fetch('/api/announcements/college')
      if (announcementsResponse.ok) {
        const announcementsData = await announcementsResponse.json()
        setRecentAnnouncements(announcementsData.slice(0, 5))
      }

      // Fetch system alerts
      const alertsResponse = await fetch('/api/admin/alerts')
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json()
        setSystemAlerts(alertsData.slice(0, 3))
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

  if (loading) {
    return (
      <DashboardLayout title="College Administration" allowedRoles={['ADMIN']}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Dark Floating Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-gray-900 transform transition-transform duration-300 ease-in-out z-50 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-72'
      }`}>
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Admin Portal</h3>
                  <p className="text-gray-400 text-sm">{session?.user?.name}</p>
                </div>
              </div>
              <Button
                onClick={() => setSidebarOpen(false)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* College Statistics */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <BarChart className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">College Stats</h4>
                  <p className="text-gray-400 text-sm">Overview</p>
                </div>
              </div>
              <div className="space-y-3 ml-13">
                <div className="p-3 bg-gray-800 rounded-lg border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-blue-400 mr-2" />
                      <span className="text-white font-medium">Students</span>
                    </div>
                    <span className="text-white font-bold">{collegeStats.totalStudents}</span>
                  </div>
                </div>
                <div className="p-3 bg-gray-800 rounded-lg border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Shield className="h-5 w-5 text-green-400 mr-2" />
                      <span className="text-white font-medium">Faculty</span>
                    </div>
                    <span className="text-white font-bold">{collegeStats.totalTeachers}</span>
                  </div>
                </div>
                <div className="p-3 bg-gray-800 rounded-lg border-l-4 border-purple-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Building className="h-5 w-5 text-purple-400 mr-2" />
                      <span className="text-white font-medium">Departments</span>
                    </div>
                    <span className="text-white font-bold">{collegeStats.totalDepartments}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Administrative Actions */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">Admin Actions</h4>
                  <p className="text-gray-400 text-sm">Quick access</p>
                </div>
              </div>
              <div className="space-y-3 ml-13">
                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  College Announcement
                </Button>
                <Button variant="ghost" className="w-full text-gray-300 hover:text-white hover:bg-gray-800 justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  User Management
                </Button>
                <Button variant="ghost" className="w-full text-gray-300 hover:text-white hover:bg-gray-800 justify-start">
                  <Building className="h-4 w-4 mr-2" />
                  Department Overview
                </Button>
                <Button variant="ghost" className="w-full text-gray-300 hover:text-white hover:bg-gray-800 justify-start">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Analytics & Reports
                </Button>
              </div>
            </div>

            {/* System Alerts */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">System Alerts</h4>
                  <p className="text-gray-400 text-sm">System status</p>
                </div>
              </div>
              <div className="space-y-3 ml-13">
                {systemAlerts.length > 0 ? systemAlerts.slice(0, 2).map((alert, index) => (
                  <div key={index} className="p-3 bg-gray-800 rounded-lg border-l-4 border-red-500">
                    <h5 className="text-white font-medium text-sm">{alert.title}</h5>
                    <p className="text-gray-400 text-xs mt-1">{alert.message}</p>
                    <Badge variant="destructive" className="mt-2 text-xs">Alert</Badge>
                  </div>
                )) : (
                  <div className="p-4 bg-gray-800 rounded-lg text-center">
                    <Shield className="h-8 w-8 text-green-400 mx-auto mb-2" />
                    <p className="text-green-400 text-sm">All systems operational</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Announcements */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Bell className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">Recent Announcements</h4>
                  <p className="text-gray-400 text-sm">College updates</p>
                </div>
              </div>
              <div className="space-y-3 ml-13">
                {recentAnnouncements.length > 0 ? recentAnnouncements.slice(0, 2).map((announcement) => (
                  <div key={announcement.id} className="p-3 bg-gray-800 rounded-lg border-l-4 border-purple-500">
                    <h5 className="text-white font-medium text-sm">{announcement.title}</h5>
                    <p className="text-gray-400 text-xs mt-1">{formatDate(announcement.createdAt)}</p>
                    <Badge variant="secondary" className={`mt-2 ${getPriorityColor(announcement.priority)} text-white text-xs`}>
                      {announcement.priority}
                    </Badge>
                  </div>
                )) : (
                  <div className="p-4 bg-gray-800 rounded-lg text-center">
                    <Bell className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No recent announcements</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="p-6 border-t border-gray-800">
            <Button
              onClick={() => signOut()}
              variant="ghost"
              className="w-full text-red-400 hover:text-red-300 hover:bg-gray-800 justify-start"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar Toggle Button */}
      <Button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-6 left-6 z-40 bg-gray-900 hover:bg-gray-800 text-white shadow-lg rounded-lg p-3"
        size="sm"
      >
        <Shield className="h-5 w-5" />
      </Button>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <DashboardLayout title="College Administration" allowedRoles={['ADMIN']}>
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              College Administration Portal 🏛️
            </h1>
            <p className="text-gray-600 mt-2">
              System Administrator - {session?.user?.name}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - College Stats & Quick Info */}
            <div className="space-y-6">
              {/* College Statistics */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-white shadow-sm border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">Students</p>
                        <p className="text-2xl font-bold text-gray-900">{collegeStats.totalStudents}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white shadow-sm border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Shield className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">Faculty</p>
                        <p className="text-2xl font-bold text-gray-900">{collegeStats.totalTeachers}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white shadow-sm border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Building className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">Departments</p>
                        <p className="text-2xl font-bold text-gray-900">{collegeStats.totalDepartments}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white shadow-sm border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <MessageSquare className="h-6 w-6 text-orange-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">Announcements</p>
                        <p className="text-2xl font-bold text-gray-900">{collegeStats.activeAnnouncements}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* System Alerts */}
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900">
                    <Shield className="h-5 w-5 mr-2" />
                    System Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {systemAlerts.length > 0 ? (
                    <div className="space-y-3">
                      {systemAlerts.map((alert, index) => (
                        <div key={index} className="border-l-4 border-red-500 pl-4 py-2 bg-red-50 rounded">
                          <h4 className="font-medium text-red-800">{alert.title}</h4>
                          <p className="text-sm text-red-600">{alert.message}</p>
                          <Badge variant="destructive" className="mt-1">Alert</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 text-green-500 mx-auto mb-2" />
                      <p className="text-green-600 font-medium">All systems operational</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent College Announcements */}
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Recent College Announcements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentAnnouncements.length > 0 ? (
                    <div className="space-y-3">
                      {recentAnnouncements.map((announcement) => (
                        <div key={announcement.id} className="border-l-4 border-blue-500 pl-4 py-2">
                          <h4 className="font-medium text-gray-900">{announcement.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {announcement.content.substring(0, 80)}...
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <Badge variant="outline">{announcement.type}</Badge>
                            <p className="text-xs text-gray-400">{formatDate(announcement.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No recent announcements</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - AI Assistant */}
            <div className="lg:col-span-2">
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Administrative AI Assistant
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    I can help you with college-wide announcements, system administration, user management, analytics, and institutional oversight.
                  </p>
                </CardHeader>
                <CardContent className="p-0">
                  <Chatbot userRole="ADMIN" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </div>
  )
}
