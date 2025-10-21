'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User,
  Loader2,
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from 'lucide-react'
import { useVoiceChat } from '@/hooks/useVoiceChat'

interface Message {
  id: string
  text: string
  sender: 'user' | 'ai'
  timestamp: Date
}

export default function SimpleAIChatbot() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const userRole = session?.user?.role || 'student'
  const userDepartment = session?.user?.department || ''
  const userId = session?.user?.id || 'anonymous'

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
      setInputText(text)
    },
    onError: (error) => {
      console.error('Voice chat error:', error)
    }
  })

  // Initial welcome message based on role
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      text: userRole === 'student' 
        ? "Hi there! I'm your AI study companion. Ask me anything about your studies, college life, or if you need academic guidance. How can I help you today?" 
        : "Hello! I'm your AI teaching assistant. I'm here to help with educational strategies, curriculum planning, student assessment, or any other teaching-related questions. What would you like to discuss?",
      sender: 'ai',
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
  }, [userRole])

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:8000/api/simple-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userMessage.text,
          user_id: userId,
          role: userRole,
          department: userDepartment
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: 'ai',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])

    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
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
    // Prevent event bubbling
    if (event) {
      event.stopPropagation()
      event.preventDefault()
    }
    
    console.log('🎯 Simple AI - Speaker clicked')
    console.log('Currently speaking:', isSpeaking)
    
    // If already speaking, stop it
    if (isSpeaking) {
      console.log('🛑 Stopping speech')
      stopSpeaking()
      return
    }
    
    // Start speaking
    const cleanText = text.trim()
    if (!cleanText) {
      console.warn('❌ No text to speak')
      return
    }
    
    console.log('🎤 Starting speech:', cleanText.substring(0, 50) + '...')
    speak(cleanText)
  }

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getRoleDisplayName = () => {
    switch (userRole) {
      case 'student': return 'Student Assistant'
      case 'teacher': return 'Teaching Assistant'
      default: return 'AI Assistant'
    }
  }

  const getRoleIcon = () => {
    switch (userRole) {
      case 'student': return <User className="w-4 h-4" />
      case 'teacher': return <Sparkles className="w-4 h-4" />
      default: return <Bot className="w-4 h-4" />
    }
  }

  const getRoleBadgeColor = () => {
    switch (userRole) {
      case 'student': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'teacher': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto h-[600px] flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center space-x-2">
                <span>{getRoleDisplayName()}</span>
                {getRoleIcon()}
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI-powered {userRole === 'student' ? 'study' : 'teaching'} companion
              </p>
            </div>
          </div>
          <Badge className={getRoleBadgeColor()}>
            {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Mode
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 pr-4 mb-4 overflow-y-auto" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white ml-4'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 mr-4'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.sender === 'ai' && (
                      <Bot className="w-4 h-4 mt-1 text-purple-600" />
                    )}
                    {message.sender === 'user' && (
                      <User className="w-4 h-4 mt-1 text-blue-200" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                      <div className={`flex justify-between items-center mt-1 ${
                        message.sender === 'user' 
                          ? 'text-blue-200' 
                          : 'text-gray-500 dark:text-gray-400'
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
                        <p className="text-xs">
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2 mr-4">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4 text-purple-600" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                userRole === 'student' 
                  ? "Ask me about studies, assignments, or college life..." 
                  : "Ask me about teaching methods, curriculum, or educational strategies..."
              }
              disabled={isLoading}
              className="pr-12"
            />
            <Button
              variant="ghost"
              size="sm"
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 rounded-lg transition-all duration-200 hover:scale-110 ${
                isListening 
                  ? 'text-red-500 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50' 
                  : 'text-gray-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30'
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
            disabled={!inputText.trim() || isLoading}
            size="sm"
            className="px-4"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Helper text */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          {userRole === 'student' 
            ? "💡 Try asking about study tips, time management, or course guidance"
            : "💡 Try asking about teaching strategies, assessment methods, or classroom management"
          }
        </p>
      </CardContent>
    </Card>
  )
}