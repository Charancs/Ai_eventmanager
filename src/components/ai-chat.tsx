'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Brain, 
  Send, 
  Loader2, 
  User, 
  FileText
} from 'lucide-react'

interface ChatMessage {
  id: string
  text: string
  sender: 'user' | 'ai'
  timestamp: Date
  sourcesCount?: number
}

interface AiChatProps {
  userRole: string
  userId?: string
  assistantName?: string
}

export default function AiChat({ userRole, userId = '1', assistantName = "AI Assistant" }: AiChatProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: '1',
      text: `Hello! I'm your ${assistantName}. I can help you find information from your uploaded documents. Ask me anything about the content you've shared!`,
      sender: 'ai',
      timestamp: new Date(),
      sourcesCount: 0
    }
    setMessages([welcomeMessage])
  }, [assistantName])

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const currentUserId = userId?.toString() || session?.user?.id || '1'
    const currentRole = userRole || session?.user?.role || 'admin'

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:8000/api/documents/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userMessage.text,
          user_id: parseInt(currentUserId),
          role: currentRole
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const result = await response.json()

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: result.response,
        sender: 'ai',
        timestamp: new Date(),
        sourcesCount: result.sources_count
      }

      setMessages(prev => [...prev, aiMessage])

    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I encountered an error while processing your question. Please make sure you have uploaded some documents and try again.",
        sender: 'ai',
        timestamp: new Date(),
        sourcesCount: 0
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-500" />
          {assistantName}
          <Badge variant="outline" className="ml-auto text-green-600 border-green-600 bg-green-50 dark:bg-green-900/20">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
            Online
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div className={`flex items-start gap-3 max-w-[80%] ${
                message.sender === 'user' ? 'flex-row-reverse' : ''
              }`}>
                <Avatar className="w-8 h-8">
                  <AvatarFallback className={`${
                    message.sender === 'user' 
                      ? 'bg-blue-100 dark:bg-blue-900' 
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    {message.sender === 'user' ? (
                      <User className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Brain className="w-4 h-4 text-gray-600" />
                    )}
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col">
                  <div className={`p-3 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  </div>
                  
                  <div className={`flex items-center gap-2 mt-1 text-xs text-gray-500 ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}>
                    <span>{formatTime(message.timestamp)}</span>
                    {message.sender === 'ai' && message.sourcesCount !== undefined && message.sourcesCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        <FileText className="w-3 h-3 mr-1" />
                        {message.sourcesCount} sources
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start gap-3 max-w-[80%]">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-gray-100 dark:bg-gray-800">
                    <Brain className="w-4 h-4 text-gray-600" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Thinking...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your documents..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="sm"
              className="px-3"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Press Enter to send  Shift+Enter for new line
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
