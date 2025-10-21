'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Send, BookOpen, User, Bot, Loader2, Search, Building, GraduationCap, Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useVoiceChat } from '@/hooks/useVoiceChat'

interface ChatMessage {
  id: string
  text: string
  sender: 'user' | 'ai'
  timestamp: Date
  sources?: any[]
}

interface SubjectChatbotProps {
  className?: string
  selectedDepartment?: string
}

interface Department {
  id: number
  name: string
  code: string
  description: string
  active: boolean
}

interface Subject {
  name: string
  file_count: number
  path: string
}

export default function SubjectChatbot({ className = '', selectedDepartment }: SubjectChatbotProps) {
  const { data: session } = useSession()
  const [departments, setDepartments] = useState<Department[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [currentDepartment, setCurrentDepartment] = useState<string>(selectedDepartment || '')
  const [currentSubject, setCurrentSubject] = useState<string>('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: "Hello! I'm your Subject Document Assistant. Please select a department and subject, then ask me anything about course materials, assignments, or academic resources.",
      sender: 'ai',
      timestamp: new Date()
    }
  ])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Voice chat functionality
  const {
    isListening,
    isSpeaking,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    speak,
    stopSpeaking
  } = useVoiceChat({
    onTranscript: (text) => {
      setCurrentMessage(text)
    },
    onError: (error) => {
      console.error('Voice chat error:', error)
    }
  })

  // Load departments on component mount
  useEffect(() => {
    fetchDepartments()
  }, [])

  // Load subjects when department changes
  useEffect(() => {
    if (currentDepartment) {
      fetchSubjects(currentDepartment)
      setCurrentSubject('')
    } else {
      setSubjects([])
      setCurrentSubject('')
    }
  }, [currentDepartment])

  // Update department if prop changes
  useEffect(() => {
    if (selectedDepartment && selectedDepartment !== currentDepartment) {
      setCurrentDepartment(selectedDepartment)
    }
  }, [selectedDepartment])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchDepartments = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/departments')
      if (response.ok) {
        const data = await response.json()
        setDepartments(data.departments || [])
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  const fetchSubjects = async (department: string) => {
    setIsLoadingSubjects(true)
    try {
      const response = await fetch(`http://localhost:8000/api/subjects/list/${encodeURIComponent(department)}`)
      if (response.ok) {
        const data = await response.json()
        setSubjects(data.subjects || [])
      }
    } catch (error) {
      console.error('Error fetching subjects:', error)
    } finally {
      setIsLoadingSubjects(false)
    }
  }

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isLoading || !currentDepartment || !currentSubject) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: currentMessage.trim(),
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setCurrentMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:8000/api/subject-documents/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userMessage.text,
          user_id: session?.user?.id || 'anonymous',
          role: session?.user?.role || 'student',
          department: currentDepartment,
          subject: currentSubject,
          search_scope: 'subject'
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
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: "I'm sorry, I encountered an error while processing your question. Please try again.",
          sender: 'ai',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble connecting right now. Please check your connection and try again.",
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
      handleSendMessage()
    }
  }

  const handleSpeakMessage = (text: string, event?: React.MouseEvent) => {
    console.log('🎯 HANDLE SPEAK MESSAGE called (Subject)')
    console.log('Text to speak:', text)
    console.log('Current isSpeaking state:', isSpeaking)
    
    if (isSpeaking) {
      console.log('🛑 Stopping current speech')
      stopSpeaking()
      return
    }
    
    const cleanText = text.trim()
    if (!cleanText || cleanText.length === 0) {
      console.warn('❌ No text to speak')
      return
    }
    
    console.log('🚀 Calling speak function directly')
    speak(cleanText)
  }

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const canSendMessage = currentMessage.trim() && !isLoading && currentDepartment && currentSubject

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      <Card className="h-[600px] flex flex-col shadow-2xl border-0 bg-gradient-to-br from-white via-gray-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            <div className="p-2 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg shadow-md">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            Subject Document Assistant
            {currentDepartment && currentSubject && (
              <Badge variant="secondary" className="ml-2">
                {currentSubject}
              </Badge>
            )}
          </CardTitle>
          
          {/* Department and Subject Selection */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Department</label>
              <select 
                value={currentDepartment} 
                onChange={(e) => setCurrentDepartment(e.target.value)}
                className="h-9 w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 focus:border-green-500 rounded-md bg-background ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Select department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
              <select
                value={currentSubject}
                onChange={(e) => setCurrentSubject(e.target.value)}
                disabled={!currentDepartment || isLoadingSubjects}
                className="h-9 w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 focus:border-green-500 rounded-md bg-background ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">{isLoadingSubjects ? "Loading..." : "Select subject"}</option>
                {subjects.map((subject) => (
                  <option key={subject.name} value={subject.name}>
                    {subject.name} ({subject.file_count} docs)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-4">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.sender === 'user' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/50 dark:to-blue-900/50'
                  }`}>
                    {message.sender === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                  <div className={`rounded-2xl px-4 py-3 ${
                    message.sender === 'user'
                      ? 'bg-green-500 text-white'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                    <div className={`flex justify-between items-center mt-2 ${
                      message.sender === 'user' ? 'text-green-100' : 'text-gray-500'
                    }`}>
                      {message.sender === 'ai' && isSupported && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSpeakMessage(message.text)}
                          className={`h-6 px-2 text-xs transition-all duration-200 hover:scale-105 ${
                            isSpeaking 
                              ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50' 
                              : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                          }`}
                          title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
                        >
                          {isSpeaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                        </Button>
                      )}
                      <span className="text-xs">
                        {formatTimestamp(message.timestamp)}
                      </span>
                    </div>
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          📚 Sources: {message.sources.length} document(s)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/50 dark:to-blue-900/50 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            {!currentDepartment || !currentSubject ? (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-center">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  📚 Please select both a department and subject to start chatting about course materials
                </p>
              </div>
            ) : (
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Input
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Ask about ${currentSubject} materials...`}
                    disabled={isLoading}
                    className="pr-12 border-2 border-gray-200 dark:border-gray-600 focus:border-green-500"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 rounded-lg transition-all duration-200 hover:scale-110 ${
                      isListening 
                        ? 'text-red-500 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50' 
                        : 'text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30'
                    }`}
                    onClick={toggleListening}
                    disabled={isLoading || !isSupported}
                    title={isListening ? 'Stop recording' : 'Start voice input'}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!canSendMessage}
                  className="px-4 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}