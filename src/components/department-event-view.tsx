'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Calendar, FileText, Eye, Download, Search, Building, Clock, MapPin, AlertCircle, Bell } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface UpcomingDepartmentEvent {
  id: string
  type: string
  department: string
  title: string
  message: string
  event_date: string
  event_time?: string
  location?: string
  document_path?: string
  document_id: string
  user_role: string
  priority: 'urgent' | 'high' | 'medium'
  created_at: string
}

interface DepartmentEventDocument {
  id: string
  title: string
  description: string
  eventType?: string  // Made optional
  department: string
  uploadDate: string
  filename: string
  fileUrl: string
}

interface DepartmentEventViewProps {
  className?: string
}

export default function DepartmentEventView({ className = '' }: DepartmentEventViewProps) {
  const { data: session } = useSession()
  const [documents, setDocuments] = useState<DepartmentEventDocument[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingDepartmentEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [eventsLoading, setEventsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'upcoming' | 'documents'>('upcoming')
  
  // Get user's department - could be from session or props
  const userDepartment = session?.user?.department || 'Computer Science'

  useEffect(() => {
    fetchUpcomingEvents()
    fetchDocuments()
  }, [userDepartment])

  const fetchUpcomingEvents = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/notifications/events/upcoming')
      if (response.ok) {
        const data = await response.json()
        // Filter only department events for the user's department
        const departmentEvents = data.notifications?.filter((event: UpcomingDepartmentEvent) => {
          if (event.type !== 'department_event') return false
          
          // Handle department name variations
          const eventDept = event.department?.toLowerCase().replace(/\s+/g, '')
          const userDept = userDepartment.toLowerCase().replace(/\s+/g, '')
          
          return eventDept === userDept
        }) || []
        setUpcomingEvents(departmentEvents)
      }
    } catch (error) {
      console.error('Error fetching upcoming department events:', error)
    } finally {
      setEventsLoading(false)
    }
  }

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/department-events/list/${encodeURIComponent(userDepartment)}`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.events || [])
      }
    } catch (error) {
      console.error('Error fetching department events:', error)
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
      <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border-cyan-200 dark:border-cyan-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-700 dark:text-cyan-300">
            <Building className="w-5 h-5" />
            {userDepartment} Department Events & Announcements
          </CardTitle>
          <p className="text-sm text-cyan-600 dark:text-cyan-400">
            View upcoming department events and browse department documents
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
                  ? 'bg-white dark:bg-gray-700 text-cyan-600 dark:text-cyan-400 shadow-sm'
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
                  ? 'bg-white dark:bg-gray-700 text-cyan-600 dark:text-cyan-400 shadow-sm'
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

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-500" />
            Search {activeTab === 'upcoming' ? 'Upcoming Events' : 'Documents'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            placeholder={`Search ${activeTab === 'upcoming' ? 'events' : 'documents'} by title, description...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Upcoming Events Tab */}
      {activeTab === 'upcoming' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-500" />
              Upcoming {userDepartment} Events ({filteredEvents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eventsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading upcoming events...</span>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchTerm ? 'No matching events found' : `No upcoming ${userDepartment} events`}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm 
                    ? 'Try adjusting your search terms.' 
                    : `No ${userDepartment} department events scheduled for the next few days.`
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
                          <Badge variant="outline" className="text-cyan-600 dark:text-cyan-400">
                            {getDaysFromNow(event.event_date)}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {event.user_role}
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
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-cyan-700 bg-cyan-100 hover:bg-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400 dark:hover:bg-cyan-900/40 rounded-md transition-colors"
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
              {userDepartment} Event Documents ({filteredDocuments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading department events...</span>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchTerm ? 'No matching documents found' : `No ${userDepartment} events available`}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm 
                    ? 'Try adjusting your search terms or clear the search to see all documents.' 
                    : `${userDepartment} event documents will appear here once uploaded by department admins.`
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
                          <Badge variant="outline" className="text-xs">
                            {doc.department}
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