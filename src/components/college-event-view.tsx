'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar, FileText, Eye, Download, Search, Clock, MapPin, AlertCircle, Bell, Filter, Building, GraduationCap, ChevronDown } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface UpcomingEvent {
  id: string
  type: string
  title: string
  message: string
  event_date: string
  event_time?: string
  location?: string
  document_path?: string
  document_id: string
  priority: 'urgent' | 'high' | 'medium'
  created_at: string
}

interface CollegeEventDocument {
  id: string
  title: string
  description: string
  eventType?: string  // Made optional
  uploadDate: string
  filename: string
  fileUrl: string
}

interface CollegeEventViewProps {
  className?: string
}

export default function CollegeEventView({ className = '' }: CollegeEventViewProps) {
  const { data: session } = useSession()
  const [documents, setDocuments] = useState<CollegeEventDocument[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [eventsLoading, setEventsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'upcoming' | 'documents'>('upcoming')
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>('all')
  const [departmentFilterOpen, setDepartmentFilterOpen] = useState(false)

  // Check if user is college admin
  const isCollegeAdmin = session?.user?.role === 'admin'

  // Available departments for filtering
  const departments = [
    { value: 'all', label: 'All Departments' },
    { value: 'college', label: 'College-wide Events' },
    { value: 'ComputerScience', label: 'Computer Science' },
    { value: 'Electronics', label: 'Electronics & Communication' },
    { value: 'Mechanical', label: 'Mechanical Engineering' },
    { value: 'Civil', label: 'Civil Engineering' },
    { value: 'Electrical', label: 'Electrical Engineering' },
    { value: 'IT', label: 'Information Technology' },
    { value: 'MBA', label: 'MBA' },
  ]

  useEffect(() => {
    fetchUpcomingEvents()
    fetchDocuments()
  }, [selectedDepartmentFilter])

  const fetchUpcomingEvents = async () => {
    try {
      let url = 'http://localhost:8000/api/notifications/events/upcoming'
      
      // Add department filter for college admins
      if (isCollegeAdmin && selectedDepartmentFilter !== 'all') {
        url += `?department=${selectedDepartmentFilter}`
      }
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        
        if (isCollegeAdmin) {
          // For college admin, show filtered events
          setUpcomingEvents(data.notifications || [])
        } else {
          // For regular users, show only college events
          const collegeEvents = data.notifications?.filter((event: UpcomingEvent) => 
            event.type === 'college_event'
          ) || []
          setUpcomingEvents(collegeEvents)
        }
      }
    } catch (error) {
      console.error('Error fetching upcoming events:', error)
    } finally {
      setEventsLoading(false)
    }
  }

  const fetchDocuments = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/college-events/list')
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.events || [])
      }
    } catch (error) {
      console.error('Error fetching college events:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.eventType && doc.eventType.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const filteredEvents = upcomingEvents.filter(event => {
    if (!searchTerm.trim()) return true // Show all events when no search term
    return event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           event.message.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return ''
    try {
      const [hours, minutes] = timeString.split(':')
      const date = new Date()
      date.setHours(parseInt(hours), parseInt(minutes))
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } catch (error) {
      return timeString
    }
  }

  const getDaysFromNow = (dateString: string) => {
    const eventDate = new Date(dateString)
    const today = new Date()
    const diffTime = eventDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays === 2) return 'Day after tomorrow'
    return `In ${diffDays} days`
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'high': return <Bell className="w-4 h-4 text-orange-500" />
      default: return <Calendar className="w-4 h-4 text-blue-500" />
    }
  }

  const getEventTypeColor = (type: string | undefined) => {
    if (!type) return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    
    switch (type.toLowerCase()) {
      case 'college': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      case 'department': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      // Legacy support for existing event types
      case 'academic': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'cultural': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      case 'sports': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'technical': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      case 'workshop': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            {isCollegeAdmin ? 'All Events & Announcements (Admin View)' : 'College Events & Announcements'}
          </CardTitle>
          <p className="text-sm text-purple-600 dark:text-purple-400">
            {isCollegeAdmin 
              ? 'View all college and department events with filtering options'
              : 'View upcoming college events and browse event documents'
            }
          </p>
        </CardHeader>
      </Card>

      {/* Tab Navigation */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'upcoming'
                  ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <span className="flex items-center gap-2 justify-center">
                <Bell className="w-4 h-4" />
                Upcoming Events ({upcomingEvents.length})
              </span>
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'documents'
                  ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <span className="flex items-center gap-2 justify-center">
                <FileText className="w-4 h-4" />
                All Documents ({documents.length})
              </span>
            </button>
          </div>
        </CardHeader>
      </Card>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-500" />
            Search {activeTab === 'upcoming' ? 'Upcoming Events' : 'Documents'}
            {isCollegeAdmin && activeTab === 'upcoming' && (
              <Badge variant="outline" className="ml-2 text-xs bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400">
                Admin View
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="text"
            placeholder={`Search ${activeTab === 'upcoming' ? 'events' : 'documents'} by title, description...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
          
          {/* Department Filter for College Admin */}
          {isCollegeAdmin && activeTab === 'upcoming' && (
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-900/10 dark:to-cyan-900/10 border border-blue-200/30 dark:border-blue-800/30 rounded-lg backdrop-blur-sm">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Filter by Department:
                </span>
              </div>
              <div className="relative w-full sm:w-auto min-w-[200px]">
                <Button
                  variant="outline"
                  onClick={() => setDepartmentFilterOpen(!departmentFilterOpen)}
                  className="w-full justify-between bg-white/80 dark:bg-slate-800/80 border border-blue-200 dark:border-blue-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                >
                  {departments.find(d => d.value === selectedDepartmentFilter)?.label || 'All Departments'}
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${departmentFilterOpen ? 'rotate-180' : ''}`} />
                </Button>
                {departmentFilterOpen && (
                  <div className="absolute top-full mt-2 w-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-md shadow-xl border border-blue-200 dark:border-blue-700 rounded-lg py-2 z-50">
                    {departments.map((dept) => (
                      <button
                        key={dept.value}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-sm flex items-center space-x-2"
                        onClick={() => {
                          setSelectedDepartmentFilter(dept.value)
                          setDepartmentFilterOpen(false)
                        }}
                      >
                        {dept.value === 'all' ? (
                          <span className="text-blue-600 dark:text-blue-400">📋</span>
                        ) : dept.value === 'college' ? (
                          <span className="text-purple-600 dark:text-purple-400">🏛️</span>
                        ) : (
                          <span className="text-blue-600 dark:text-blue-400">🏫</span>
                        )}
                        <span>{dept.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedDepartmentFilter !== 'all' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDepartmentFilter('all')}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Clear Filter
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Events Tab */}
      {activeTab === 'upcoming' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              {isCollegeAdmin ? 'All Upcoming Events' : 'Upcoming College Events'} ({filteredEvents.length})
              {selectedDepartmentFilter !== 'all' && (
                <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400">
                  Filtered: {departments.find(d => d.value === selectedDepartmentFilter)?.label}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eventsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading upcoming events...</span>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchTerm ? 'No matching events found' : 'No upcoming events'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm 
                    ? 'Try adjusting your search terms.' 
                    : 'No college events scheduled for the next few days.'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEvents.map((event) => (
                  <div key={event.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          {getPriorityIcon(event.priority)}
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                            {event.title}
                          </h3>
                          <Badge className={getPriorityColor(event.priority)}>
                            {event.priority.toUpperCase()}
                          </Badge>
                          
                          {/* Department badge for department events (admin view) */}
                          {event.type === 'department_event' && isCollegeAdmin && (event as any).department && (
                            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400">
                              <Building className="w-3 h-3 mr-1" />
                              {departments.find(d => d.value === (event as any).department)?.label || (event as any).department}
                            </Badge>
                          )}
                          
                          {/* Event type badge */}
                          <Badge variant="outline" className={
                            event.type === 'college_event' 
                              ? "text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800"
                              : "text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                          }>
                            {event.type === 'college_event' ? '🏛️ College' : '🏫 Department'}
                          </Badge>
                          
                          <Badge variant="outline" className="text-purple-600 dark:text-purple-400">
                            {getDaysFromNow(event.event_date)}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {event.message}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(event.event_date)}</span>
                          </div>
                          {event.event_time && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatTime(event.event_time)}</span>
                            </div>
                          )}
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {event.document_path && (
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => {
                              // You can implement document viewing logic here
                              console.log('View document:', event.document_path)
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/40 rounded-md transition-colors"
                            title="View document"
                          >
                            <Eye className="w-3 h-3" />
                            View Document
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-500" />
              College Event Documents ({filteredDocuments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading college events...</span>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchTerm ? 'No matching documents found' : 'No college events available'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm 
                    ? 'Try adjusting your search terms or clear the search to see all documents.' 
                    : 'College event documents will appear here once uploaded by the admin.'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDocuments.map((doc) => (
                  <div key={doc.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                            {doc.title}
                          </h3>
                          <Badge className={getEventTypeColor(doc.eventType)}>
                            {doc.eventType || 'General'}
                          </Badge>
                        </div>
                        
                        {doc.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {doc.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Uploaded: {formatDate(doc.uploadDate)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            <span>{doc.filename}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => window.open(doc.fileUrl, '_blank')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded-md transition-colors"
                          title="View document"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                        <button
                          onClick={() => {
                            const link = document.createElement('a')
                            link.href = doc.fileUrl
                            link.download = doc.filename
                            link.click()
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40 rounded-md transition-colors"
                          title="Download document"
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}