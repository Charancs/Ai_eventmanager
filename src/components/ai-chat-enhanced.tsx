'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { 
  Brain, 
  Send, 
  Loader2, 
  User, 
  FileText,
  MessageCircle,
  Filter,
  BookOpen,
  Building
} from 'lucide-react'

interface ChatMessage {
  id: string
  text: string
  sender: 'user' | 'ai'
  timestamp: Date
  sourcesCount?: number
  searchContext?: {
    scope: string
    department: string
    subject?: string
  }
  contextBreakdown?: {
    departments_searched: string[]
    subjects_searched: string[]
    storage_types: string[]
  }
}

interface AiChatProps {
  userRole: string
  userId?: string
  assistantName?: string
}

interface AvailableContext {
  department: string
  general_documents: number
  subjects: Record<string, number>
}

export default function AiChat({ userRole, userId = '1', assistantName = "AI Assistant" }: AiChatProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [availableContexts, setAvailableContexts] = useState<AvailableContext | null>(null)
  const [searchScope, setSearchScope] = useState<string>('all')
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [showContextOptions, setShowContextOptions] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const currentDepartment = session?.user?.department || (userRole === 'admin' ? 'admin' : 'Computer Science')
  const currentUserId = userId || session?.user?.id || '1'

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load available contexts on component mount
  useEffect(() => {
    loadAvailableContexts()
  }, [currentDepartment])

  // Add welcome message on component mount
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

  const loadAvailableContexts = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/documents/contexts?user_id=${currentUserId}&role=${userRole}&department=${encodeURIComponent(currentDepartment)}`)
      if (response.ok) {
        const result = await response.json()
        setAvailableContexts(result.data)
      }
    } catch (error) {
      console.error('Error loading contexts:', error)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

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
      // Use context-aware endpoint if specific context is selected
      const useContextEndpoint = searchScope !== 'all' || selectedSubject
      const endpoint = useContextEndpoint 
        ? 'http://localhost:8000/api/documents/chat-context'
        : 'http://localhost:8000/api/documents/chat'

      const requestBody = useContextEndpoint ? {
        query: userMessage.text,
        user_id: currentUserId,
        role: userRole,
        department: currentDepartment,
        subject: selectedSubject || null,
        search_scope: searchScope
      } : {
        query: userMessage.text,
        user_id: parseInt(currentUserId),
        role: userRole
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: 'ai',
        timestamp: new Date(),
        sourcesCount: data.sources_count,
        searchContext: data.search_context,
        contextBreakdown: data.context_breakdown
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error while processing your question. Please try again.',
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

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-500" />
            {assistantName}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowContextOptions(!showContextOptions)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Context
          </Button>
        </div>
        
        {/* Context Selection Panel */}
        {showContextOptions && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
            <div>
              <Label className="text-sm font-medium">Search Scope</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant={searchScope === 'all' ? 'default' : 'outline'}
                  onClick={() => setSearchScope('all')}
                >
                  All Documents
                </Button>
                <Button
                  size="sm"
                  variant={searchScope === 'department' ? 'default' : 'outline'}
                  onClick={() => setSearchScope('department')}
                >
                  <Building className="w-4 h-4 mr-1" />
                  Department
                </Button>
                <Button
                  size="sm"
                  variant={searchScope === 'subject' ? 'default' : 'outline'}
                  onClick={() => setSearchScope('subject')}
                >
                  <BookOpen className="w-4 h-4 mr-1" />
                  Subject
                </Button>
                <Button
                  size="sm"
                  variant={searchScope === 'general' ? 'default' : 'outline'}
                  onClick={() => setSearchScope('general')}
                >
                  General
                </Button>
              </div>
            </div>
            
            {availableContexts && availableContexts.subjects && Object.keys(availableContexts.subjects).length > 0 && (
              <div>
                <Label className="text-sm font-medium">Subject (for Subject scope)</Label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  disabled={searchScope !== 'subject'}
                >
                  <option value="">Select a subject</option>
                  {Object.entries(availableContexts.subjects).map(([subject, count]) => (
                    <option key={subject} value={subject}>
                      {subject} ({count} documents)
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p><strong>Department:</strong> {currentDepartment}</p>
              {availableContexts && (
                <p><strong>Available:</strong> {availableContexts.general_documents} general documents, {Object.keys(availableContexts.subjects).length} subjects</p>
              )}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.sender === 'ai' && (
                <Avatar className="w-8 h-8 bg-blue-100 dark:bg-blue-900">
                  <AvatarFallback>
                    <Brain className="w-4 h-4 text-blue-600" />
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-blue-500 text-white ml-auto'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
                
                {/* Source information */}
                {message.sender === 'ai' && message.sourcesCount > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">
                      <FileText className="w-3 h-3 mr-1" />
                      {message.sourcesCount} sources
                    </Badge>
                    {message.searchContext && (
                      <Badge variant="outline" className="text-xs">
                        {message.searchContext.scope} scope
                      </Badge>
                    )}
                    {message.contextBreakdown && message.contextBreakdown.subjects_searched.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {message.contextBreakdown.subjects_searched.join(', ')}
                      </Badge>
                    )}
                  </div>
                )}
                
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
              
              {message.sender === 'user' && (
                <Avatar className="w-8 h-8 bg-gray-100 dark:bg-gray-800">
                  <AvatarFallback>
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start gap-3">
              <Avatar className="w-8 h-8 bg-blue-100 dark:bg-blue-900">
                <AvatarFallback>
                  <Brain className="w-4 h-4 text-blue-600" />
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
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
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
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          {/* Current context indicator */}
          {(searchScope !== 'all' || selectedSubject) && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <MessageCircle className="w-4 h-4" />
              <span>
                Searching in: {searchScope} 
                {selectedSubject && searchScope === 'subject' && ` > ${selectedSubject}`}
                {` (${currentDepartment})`}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}