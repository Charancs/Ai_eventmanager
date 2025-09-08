'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Chatbot } from '@/components/chatbot'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Calendar, MessageSquare, BookOpen, Plus, GraduationCap, X, Clock, Bell, LogOut, BarChart } from 'lucide-react'

interface ClassAnnouncement {
  id: string
  title: string
  content: string
  createdAt: string
  priority: string
}

export default function TeacherDashboard() {
  const { data: session } = useSession()
  const [classAnnouncements, setClassAnnouncements] = useState<ClassAnnouncement[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  if (loading) {
    return (
      <DashboardLayout title="Teacher Dashboard" allowedRoles={['TEACHER']}>
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
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Teacher Portal</h3>
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
            {/* Quick Actions */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">Quick Actions</h4>
                  <p className="text-gray-400 text-sm">Teacher tools</p>
                </div>
              </div>
              <div className="space-y-3 ml-13">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Create Announcement
                </Button>
                <Button variant="ghost" className="w-full text-gray-300 hover:text-white hover:bg-gray-800 justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Event
                </Button>
                <Button variant="ghost" className="w-full text-gray-300 hover:text-white hover:bg-gray-800 justify-start">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Set Assignment
                </Button>
              </div>
            </div>

            {/* Class Statistics */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <BarChart className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">Class Stats</h4>
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
                    <span className="text-white font-bold">120</span>
                  </div>
                </div>
                <div className="p-3 bg-gray-800 rounded-lg border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <BookOpen className="h-5 w-5 text-green-400 mr-2" />
                      <span className="text-white font-medium">Classes</span>
                    </div>
                    <span className="text-white font-bold">5</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Announcements */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                  <Bell className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">My Announcements</h4>
                  <p className="text-gray-400 text-sm">Recent posts</p>
                </div>
              </div>
              <div className="space-y-3 ml-13">
                {classAnnouncements.length > 0 ? classAnnouncements.slice(0, 2).map((announcement) => (
                  <div key={announcement.id} className="p-3 bg-gray-800 rounded-lg border-l-4 border-orange-500">
                    <h5 className="text-white font-medium text-sm">{announcement.title}</h5>
                    <p className="text-gray-400 text-xs mt-1">{formatDate(announcement.createdAt)}</p>
                    <Badge variant="secondary" className={`mt-2 ${getPriorityColor(announcement.priority)} text-white text-xs`}>
                      {announcement.priority}
                    </Badge>
                  </div>
                )) : (
                  <div className="p-4 bg-gray-800 rounded-lg text-center">
                    <Bell className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No announcements</p>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Events */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">Upcoming Events</h4>
                  <p className="text-gray-400 text-sm">Your schedule</p>
                </div>
              </div>
              <div className="space-y-3 ml-13">
                {upcomingEvents.length > 0 ? upcomingEvents.slice(0, 2).map((event, index) => (
                  <div key={index} className="p-3 bg-gray-800 rounded-lg border-l-4 border-green-500">
                    <h5 className="text-white font-medium text-sm">{event.title}</h5>
                    <p className="text-gray-400 text-xs mt-1">{formatDate(event.date)}</p>
                    <Badge variant="secondary" className="mt-2 bg-green-600 text-white text-xs">
                      {event.type}
                    </Badge>
                  </div>
                )) : (
                  <div className="p-4 bg-gray-800 rounded-lg text-center">
                    <Calendar className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No upcoming events</p>
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
        <GraduationCap className="h-5 w-5" />
      </Button>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <DashboardLayout title="Teacher Dashboard" allowedRoles={['TEACHER']}>
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, Professor {session?.user?.name?.split(' ')[0]}! 👨‍🏫
            </h1>
            <p className="text-gray-600 mt-2">
              {session?.user?.department} Department
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Statistics & Quick Info */}
            <div className="space-y-6">
              {/* Class Statistics */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-white shadow-sm border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">Students</p>
                        <p className="text-2xl font-bold text-gray-900">120</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white shadow-sm border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">Classes</p>
                        <p className="text-2xl font-bold text-gray-900">5</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Announcements */}
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    My Recent Announcements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {classAnnouncements.length > 0 ? (
                    <div className="space-y-3">
                      {classAnnouncements.map((announcement) => (
                        <div key={announcement.id} className="border-l-4 border-blue-500 pl-4 py-2">
                          <h4 className="font-medium text-gray-900">{announcement.title}</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {announcement.content.substring(0, 80)}...
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-400">{formatDate(announcement.createdAt)}</p>
                            <Badge variant="secondary" className={`${getPriorityColor(announcement.priority)} text-white text-xs`}>
                              {announcement.priority}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No recent announcements</p>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Events */}
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900">
                    <Calendar className="h-5 w-5 mr-2" />
                    Upcoming Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingEvents.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingEvents.map((event, index) => (
                        <div key={index} className="border-l-4 border-green-500 pl-4 py-2">
                          <h4 className="font-medium text-gray-900">{event.title}</h4>
                          <p className="text-sm text-gray-500">
                            {formatDate(event.date)}
                          </p>
                          <Badge variant="secondary" className="mt-1">{event.type}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No upcoming events</p>
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
                    AI Assistant
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Ask me to help with class management, student queries, or administrative tasks.
                  </p>
                </CardHeader>
                <CardContent className="p-0">
                  <Chatbot userRole="TEACHER" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </div>
  )
}
