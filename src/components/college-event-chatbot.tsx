'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Send, Mic, MicOff, Calendar, Users, Info, MapPin } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface ChatMessage {
  id: string
  text: string
  sender: 'user' | 'ai'
  timestamp: Date
  sources?: any[]
}

interface CollegeEventChatbotProps {
  className?: string
  filterDepartment?: string
}

export default function CollegeEventChatbot({ className = '', filterDepartment }: CollegeEventChatbotProps) {
  const { data: session } = useSession()
  
  // Dynamic initial message based on department filter
  const getInitialMessage = () => {
    if (filterDepartment) {
      return `Hello! I'm your College Events Assistant, currently focused on ${filterDepartment} department events. I can help you find information about college events, announcements, activities, and schedules${filterDepartment ? ` specifically for the ${filterDepartment} department` : ''}. What would you like to know?`
    }
    return "Hello! I'm your College Events Assistant. I can help you find information about college events, announcements, activities, and schedules. What would you like to know?"
  }

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: getInitialMessage(),
      sender: 'ai',
      timestamp: new Date()
    }
  ])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Reset conversation when department filter changes
  useEffect(() => {
    setMessages([{
      id: '1',
      text: getInitialMessage(),
      sender: 'ai',
      timestamp: new Date()
    }])
  }, [filterDepartment])

  const sendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return

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
      const response = await fetch('http://localhost:8000/api/college-events/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: currentMessage,
          user_id: session?.user?.id || 'anonymous',
          role: session?.user?.role || 'student',
          filter_department: filterDepartment || null
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
        console.error('College events API error:', response.status, errorData)
        throw new Error(errorData.detail || `HTTP ${response.status}: Failed to get response from college events chatbot`)
      }
    } catch (error) {
      console.error('Error sending message to college events chatbot:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble accessing the college events information right now. Please try again later or contact the administration for assistance.",
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
      case 'calendar': return <Calendar className="h-4 w-4" />
      case 'meeting': return <Users className="h-4 w-4" />
      case 'location': return <MapPin className="h-4 w-4" />
      default: return <Info className="h-4 w-4" />
    }
  }

  return (
    <div className={`flex flex-col w-full max-w-5xl mx-auto h-full ${className}`}>
      {/* Enhanced Chat Container */}
      <Card className="flex flex-col h-[500px] md:h-[600px] lg:h-[700xl] bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-2xl border-0 rounded-3xl overflow-hidden">
        {/* Enhanced Header */}
        <CardHeader className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white p-6 md:p-8 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full transform translate-x-20 -translate-y-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full transform -translate-x-16 translate-y-16"></div>
          </div>
          
          <CardTitle className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 md:p-4 rounded-2xl backdrop-blur-sm">
                <MessageCircle className="h-6 w-6 md:h-8 md:w-8" />
              </div>
              <div>
                <h3 className="font-bold text-xl md:text-2xl mb-1">College Events Assistant</h3>
                <p className="text-sm md:text-base text-purple-100 opacity-90 font-normal">
                  Ask about events, announcements & activities
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-purple-100 font-medium">Online</span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>

        {/* Enhanced Messages Area */}
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-gradient-to-b from-gray-50/80 to-white dark:from-slate-800/50 dark:to-slate-900/50 scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-transparent">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end space-x-3 max-w-[85%] md:max-w-[80%]`}>
                  {/* Enhanced Avatar */}
                  <div className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform duration-200 hover:scale-110 ${
                    message.sender === 'user' 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-600 ml-3' 
                      : 'bg-gradient-to-r from-blue-500 to-cyan-600 mr-3'
                  }`}>
                    {message.sender === 'user' ? (
                      <span className="text-white text-sm md:text-base font-bold">
                        {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    ) : (
                      <MessageCircle className="h-5 w-5 md:h-6 md:w-6 text-white" />
                    )}
                  </div>

                  {/* Enhanced Message Bubble */}
                  <div
                    className={`rounded-2xl p-4 md:p-5 shadow-xl backdrop-blur-sm transition-all duration-200 hover:shadow-2xl ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-br-lg'
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
                                  : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                              }`}
                            >
                              <span className="mr-2">{getEventTypeIcon(source.event_type || 'info')}</span>
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
                  <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center mr-3 shadow-lg">
                    <MessageCircle className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <div className="bg-white/95 dark:bg-slate-800/95 rounded-2xl rounded-bl-lg p-5 shadow-xl border border-gray-200/50 dark:border-slate-700/50 backdrop-blur-sm">
                    <div className="flex space-x-3 items-center">
                      <div className="flex space-x-1">
                        <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce"></div>
                        <div className="w-2.5 h-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2.5 h-2.5 bg-gradient-to-r from-pink-500 to-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
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
                  placeholder="Ask about college events, announcements, or activities..."
                  className="pr-14 md:pr-16 py-4 md:py-5 rounded-2xl border-2 border-gray-200 dark:border-slate-600 focus:border-purple-400 dark:focus:border-purple-400 bg-white/90 dark:bg-slate-800/90 text-base shadow-lg backdrop-blur-sm placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  disabled={isLoading}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 md:h-12 md:w-12 p-0 rounded-xl transition-all duration-200 hover:scale-110 ${
                    isListening 
                      ? 'text-red-500 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 shadow-lg' 
                      : 'text-gray-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 shadow-md'
                  }`}
                  onClick={toggleVoiceInput}
                  disabled={isLoading}
                  title={isListening ? 'Stop recording' : 'Start voice input'}
                >
                  {isListening ? <MicOff className="h-5 w-5 md:h-6 md:w-6" /> : <Mic className="h-5 w-5 md:h-6 md:w-6" />}
                </Button>
              </div>
              <Button
                onClick={sendMessage}
                disabled={!currentMessage.trim() || isLoading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-xl hover:shadow-2xl transition-all duration-200 rounded-2xl px-6 md:px-8 py-4 md:py-5 font-semibold text-base transform hover:scale-105"
                size="sm"
              >
                <Send className="h-5 w-5 md:h-6 md:w-6" />
                <span className="ml-2 hidden sm:inline">Send</span>
              </Button>
            </div>
            
            {/* Enhanced Status Badge */}
            <div className="flex justify-center mt-4">
              <Badge variant="outline" className="text-sm bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400 px-4 py-2 rounded-full shadow-md">
                <Info className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline font-medium">College Events - Accessible to All Students & Staff</span>
                <span className="sm:hidden font-medium">College Events Chat</span>
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}