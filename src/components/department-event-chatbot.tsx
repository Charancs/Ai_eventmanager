'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Send, Mic, MicOff, Building, Users, Info, MapPin, Calendar, BookOpen } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface ChatMessage {
  id: string
  text: string
  sender: 'user' | 'ai'
  timestamp: Date
  sources?: any[]
}

interface DepartmentEventChatbotProps {
  className?: string
  defaultDepartment?: string // For department-specific pages
}

export default function DepartmentEventChatbot({ className = '', defaultDepartment }: DepartmentEventChatbotProps) {
  const { data: session } = useSession()
  
  // Map department names to proper format for backend
  const mapDepartmentName = (deptName: string) => {
    const mapping: { [key: string]: string } = {
      'Computer Science': 'ComputerScience',
      'Computerscience': 'ComputerScience',
      'Electronics & Communication': 'Electronics',
      'Mechanical Engineering': 'Mechanical',
      'Civil Engineering': 'Civil',
      'Electrical Engineering': 'Electrical',
      'Information Technology': 'IT'
    }
    return mapping[deptName] || deptName
  }
  
  const [department, setDepartment] = useState(mapDepartmentName(defaultDepartment || ''))
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: defaultDepartment 
        ? `Hello! I'm your ${defaultDepartment} Department Events Assistant. I can help you find information about department events, announcements, schedules, and activities specific to ${defaultDepartment}. What would you like to know?`
        : "Hello! I'm your Department Events Assistant. Please select a department first, then I can help you find information about department-specific events, announcements, and activities. What would you like to know?",
      sender: 'ai',
      timestamp: new Date()
    }
  ])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const departments = [
    { value: '', label: 'Select Department' },
    { value: 'ComputerScience', label: 'Computer Science' },
    { value: 'Electronics', label: 'Electronics & Communication' },
    { value: 'Mechanical', label: 'Mechanical Engineering' },
    { value: 'Civil', label: 'Civil Engineering' },
    { value: 'Electrical', label: 'Electrical Engineering' },
    { value: 'IT', label: 'Information Technology' },
    { value: 'MBA', label: 'MBA' },
    { value: 'MCA', label: 'MCA' }
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return

    if (!department) {
      alert('Please select a department first')
      return
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: currentMessage,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setCurrentMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:8000/api/department-events/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: currentMessage,
          user_id: session?.user?.id || 'anonymous',
          role: session?.user?.role || 'student',
          department: department
        })
      })

      if (response.ok) {
        const data = await response.json()
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: data.response,
          sender: 'ai',
          timestamp: new Date(),
          sources: data.source_documents || []
        }
        setMessages(prev => [...prev, aiMessage])
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Department events API error:', response.status, errorData)
        throw new Error(errorData.detail || `HTTP ${response.status}: Failed to get response from department events chatbot`)
      }
    } catch (error) {
      console.error('Error sending message to department events chatbot:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: `I'm sorry, I'm having trouble accessing the ${department} department events information right now. Please try again later or contact the ${department} department administration for assistance.`,
        sender: 'ai',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const toggleVoiceInput = () => {
    if (!isListening) {
      // Start voice recognition
      if ('webkitSpeechRecognition' in window) {
        const recognition = new (window as any).webkitSpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = false
        recognition.lang = 'en-US'

        recognition.onstart = () => {
          setIsListening(true)
        }

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          setCurrentMessage(transcript)
          setIsListening(false)
        }

        recognition.onerror = () => {
          setIsListening(false)
        }

        recognition.onend = () => {
          setIsListening(false)
        }

        recognition.start()
      }
    } else {
      setIsListening(false)
    }
  }

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getEventTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'calendar': case 'timetable': return <Calendar className="h-4 w-4" />
      case 'meeting': return <Users className="h-4 w-4" />
      case 'location': return <MapPin className="h-4 w-4" />
      case 'academic': case 'syllabus': case 'project': return <BookOpen className="h-4 w-4" />
      case 'examination': return <Info className="h-4 w-4" />
      default: return <Building className="h-4 w-4" />
    }
  }

  const handleDepartmentChange = (newDepartment: string) => {
    setDepartment(newDepartment)
    
    // Update the welcome message
    if (newDepartment) {
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        text: `Department changed to ${departments.find(d => d.value === newDepartment)?.label}. I can now help you with ${newDepartment} department events, announcements, and activities. What would you like to know?`,
        sender: 'ai',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, welcomeMessage])
    }
  }

  return (
    <div className={`flex flex-col w-full max-w-4xl mx-auto h-full ${className}`}>
      {/* Department Selection - only show if not defaultDepartment */}
      {!defaultDepartment && (
        <Card className="mb-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-lg border-0 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <Building className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Select Department for Events
                </label>
                <select 
                  value={department} 
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-gray-100"
                >
                  {departments.map((dept) => (
                    <option key={dept.value} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Chat Container */}
      <Card className="flex flex-col h-[500px] md:h-[600px] lg:h-[700px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-2xl border-0 rounded-3xl overflow-hidden">
        {/* Enhanced Header */}
        <CardHeader className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 text-white p-6 md:p-8 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full transform translate-x-20 -translate-y-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full transform -translate-x-16 translate-y-16"></div>
          </div>
          
          <CardTitle className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 md:p-4 rounded-2xl backdrop-blur-sm">
                <Building className="h-6 w-6 md:h-8 md:w-8" />
              </div>
              <div>
                <h3 className="font-bold text-xl md:text-2xl mb-1">
                  {department ? `${departments.find(d => d.value === department)?.label} Events` : 'Department Events'} Assistant
                </h3>
                <p className="text-sm md:text-base text-blue-100 opacity-90 font-normal">
                  Ask about department events, announcements & schedules
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-blue-100 font-medium">Online</span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>

        {/* Enhanced Messages Area */}
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-gradient-to-b from-gray-50/80 to-white dark:from-slate-800/50 dark:to-slate-900/50 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-transparent">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end space-x-3 max-w-[85%] md:max-w-[80%]`}>
                  {/* Enhanced Avatar */}
                  <div className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform duration-200 hover:scale-110 ${
                    message.sender === 'user' 
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-600 ml-3' 
                      : 'bg-gradient-to-r from-teal-500 to-blue-600 mr-3'
                  }`}>
                    {message.sender === 'user' ? (
                      <span className="text-white text-sm md:text-base font-bold">
                        {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    ) : (
                      <Building className="h-5 w-5 md:h-6 md:w-6 text-white" />
                    )}
                  </div>

                  {/* Enhanced Message Bubble */}
                  <div
                    className={`rounded-2xl p-4 md:p-5 shadow-xl backdrop-blur-sm transition-all duration-200 hover:shadow-2xl ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-br-lg'
                        : 'bg-white/95 dark:bg-slate-800/95 text-gray-900 dark:text-gray-100 border border-gray-200/50 dark:border-slate-700/50 rounded-bl-lg'
                    }`}
                  >
                    <p className="text-sm md:text-base leading-relaxed break-words">
                      {message.text}
                    </p>
                    
                    {/* Enhanced Sources */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/20 dark:border-gray-700/50">
                        <p className="text-xs md:text-sm opacity-90 mb-3 font-semibold flex items-center">
                          <span className="mr-2">📚</span> Sources:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {message.sources.slice(0, 3).map((source, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className={`text-xs md:text-sm px-3 py-1.5 rounded-lg font-medium transition-all duration-200 hover:scale-105 ${
                                message.sender === 'user'
                                  ? 'bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm'
                                  : 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700 hover:bg-cyan-100 dark:hover:bg-cyan-900/50'
                              }`}
                            >
                              <span className="mr-2">{getEventTypeIcon(source.event_type || 'general')}</span>
                              <span className="truncate max-w-[120px]">
                                {source.title || 'Document'}
                              </span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Enhanced Timestamp */}
                    <div className="flex justify-end mt-3">
                      <span className={`text-xs opacity-70 font-medium ${
                        message.sender === 'user' ? 'text-white/90' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Enhanced Loading Animation */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-end space-x-3 max-w-[80%]">
                  <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-r from-teal-500 to-blue-600 flex items-center justify-center mr-3 shadow-lg">
                    <Building className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <div className="bg-white/95 dark:bg-slate-800/95 rounded-2xl rounded-bl-lg p-5 shadow-xl border border-gray-200/50 dark:border-slate-700/50 backdrop-blur-sm">
                    <div className="flex space-x-3 items-center">
                      <div className="flex space-x-1">
                        <div className="w-2.5 h-2.5 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2.5 h-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Enhanced Input Area */}
          <div className="border-t border-gray-200/50 dark:border-slate-700/50 bg-white/98 dark:bg-slate-900/98 backdrop-blur-md p-4 md:p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-3">
              <div className="flex-1 relative">
                <Input
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={department ? `Ask about ${departments.find(d => d.value === department)?.label} department events...` : "Select a department first to start chatting..."}
                  className="pr-14 md:pr-16 py-4 md:py-5 rounded-2xl border-2 border-gray-200 dark:border-slate-600 focus:border-blue-400 dark:focus:border-blue-400 bg-white/90 dark:bg-slate-800/90 text-base shadow-lg backdrop-blur-sm placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  disabled={isLoading || !department}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 md:h-12 md:w-12 p-0 rounded-xl transition-all duration-200 hover:scale-110 ${
                    isListening 
                      ? 'text-red-500 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 shadow-lg' 
                      : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 shadow-md'
                  }`}
                  onClick={toggleVoiceInput}
                  disabled={isLoading || !department}
                  title={isListening ? 'Stop recording' : 'Start voice input'}
                >
                  {isListening ? <MicOff className="h-5 w-5 md:h-6 md:w-6" /> : <Mic className="h-5 w-5 md:h-6 md:w-6" />}
                </Button>
              </div>
              <Button
                onClick={sendMessage}
                disabled={!currentMessage.trim() || isLoading || !department}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-xl hover:shadow-2xl transition-all duration-200 rounded-2xl px-6 md:px-8 py-4 md:py-5 font-semibold text-base transform hover:scale-105"
                size="sm"
              >
                <Send className="h-5 w-5 md:h-6 md:w-6" />
                <span className="ml-2 hidden sm:inline">Send</span>
              </Button>
            </div>
            
            {/* Enhanced Status Badge */}
            <div className="flex justify-center mt-4">
              <Badge variant="outline" className="text-sm bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-full shadow-md">
                <Users className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline font-medium">
                  {department ? `${departments.find(d => d.value === department)?.label} Department Events - Department Members Only` : 'Department Events Chat - Select Department First'}
                </span>
                <span className="sm:hidden font-medium">
                  {department ? `${departments.find(d => d.value === department)?.label} Events` : 'Select Department'}
                </span>
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}