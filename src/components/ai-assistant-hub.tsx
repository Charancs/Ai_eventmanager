'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import CollegeEventChatbot from '@/components/college-event-chatbot'
import DepartmentEventChatbot from '@/components/department-event-chatbot'
import SubjectChatbot from '@/components/subject-chatbot'
import SimpleAIChatbot from '@/components/simple-ai-chatbot'
import { 
  MessageSquare, 
  Building, 
  School, 
  Brain,
  Filter,
  Users,
  GraduationCap,
  Bot
} from 'lucide-react'

interface Department {
  id: number
  name: string
  code: string
  description: string
  head_name: string
  email: string
  phone: string
  active: boolean
}

export default function AIAssistantHub() {
  const { data: session } = useSession()
  const [activeAssistant, setActiveAssistant] = useState<'college' | 'department' | 'subject' | 'simple'>('college')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)

  const isCollegeAdmin = session?.user?.role === 'admin'
  const isDepartmentUser = ['teacher', 'student', 'department', 'DEPARTMENT_ADMIN', 'TEACHER', 'STUDENT'].includes(session?.user?.role || '')
  const isStudentOrTeacher = ['student', 'teacher', 'STUDENT', 'TEACHER'].includes(session?.user?.role || '')
  const userDepartment = session?.user?.department

  // Debug: Log session info
  console.log('AIAssistantHub Debug:', {
    sessionRole: session?.user?.role,
    sessionDepartment: session?.user?.department,
    isCollegeAdmin,
    isDepartmentUser,
    isStudentOrTeacher,
    userDepartment,
    departmentsCount: departments.length,
    selectedDepartment,
    loading,
    sessionUser: session?.user
  })

  useEffect(() => {
    fetchDepartments()
    
    // Auto-set department for non-admin users
    if (!isCollegeAdmin && userDepartment && !selectedDepartment) {
      setSelectedDepartment(userDepartment)
    }
  }, [session, isCollegeAdmin, userDepartment, selectedDepartment])

  const fetchDepartments = async () => {
    try {
      // First try the API
      const response = await fetch('http://localhost:8000/api/departments')
      
      if (response.ok) {
        const data = await response.json()
        console.log('Departments API response:', data)
        setDepartments(data.departments || [])
        
        // Auto-select department based on user role
        if (!selectedDepartment) {
          if (!isCollegeAdmin && userDepartment) {
            // For non-admin users, use their own department
            setSelectedDepartment(userDepartment)
          } else if (isCollegeAdmin && data.departments && data.departments.length > 0) {
            // For college admin, don't auto-select, let them choose
            // setSelectedDepartment(data.departments[0].name)
          }
        }
      } else {
        console.error('Departments API failed, using fallback')
        // Fallback to hardcoded departments if API fails
        setDepartments([
          { id: 1, name: "Computer Science", code: "CSE", description: "Computer Science Dept", head_name: "Dr. Smith", email: "cs@college.edu", phone: "123", active: true },
          { id: 2, name: "Information Technology", code: "IT", description: "IT Dept", head_name: "Dr. Jane", email: "it@college.edu", phone: "124", active: true },
          { id: 3, name: "Electronics", code: "ECE", description: "ECE Dept", head_name: "Dr. Bob", email: "ece@college.edu", phone: "125", active: true }
        ])
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
      // Fallback to hardcoded departments
      setDepartments([
        { id: 1, name: "Computer Science", code: "CSE", description: "Computer Science Dept", head_name: "Dr. Smith", email: "cs@college.edu", phone: "123", active: true },
        { id: 2, name: "Information Technology", code: "IT", description: "IT Dept", head_name: "Dr. Jane", email: "it@college.edu", phone: "124", active: true },
        { id: 3, name: "Electronics", code: "ECE", description: "ECE Dept", head_name: "Dr. Bob", email: "ece@college.edu", phone: "125", active: true }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* AI Assistant Selection Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-blue-600" />
            AI Assistant Hub
            <Badge variant="secondary" className="ml-2">
              {isCollegeAdmin ? 'College Admin' : isDepartmentUser ? 'Department User' : 'User'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            {isCollegeAdmin 
              ? "As a college admin, you can access all events and filter by department."
              : `Welcome! You can access college events and your ${userDepartment || 'department'} events.`}
          </p>

          {/* Assistant Type Selection */}
          <div className="flex gap-4 mb-6 flex-wrap">
            <Button
              variant={activeAssistant === 'college' ? 'default' : 'outline'}
              onClick={() => setActiveAssistant('college')}
              className="flex items-center gap-2"
            >
              <Building className="h-4 w-4" />
              College Events
            </Button>
            <Button
              variant={activeAssistant === 'department' ? 'default' : 'outline'}
              onClick={() => setActiveAssistant('department')}
              className="flex items-center gap-2"
            >
              <School className="h-4 w-4" />
              Department Events
            </Button>
            <Button
              variant={activeAssistant === 'subject' ? 'default' : 'outline'}
              onClick={() => setActiveAssistant('subject')}
              className="flex items-center gap-2"
            >
              <GraduationCap className="h-4 w-4" />
              Subject Documents
            </Button>
            {/* Simple AI Chatbot - Only for Students and Teachers */}
            {(() => {
              console.log('Simple AI Chatbot Button Check:', {
                isStudentOrTeacher,
                sessionRole: session?.user?.role,
                shouldShow: isStudentOrTeacher
              });
              return null;
            })()}
            {isStudentOrTeacher && (
              <Button
                variant={activeAssistant === 'simple' ? 'default' : 'outline'}
                onClick={() => setActiveAssistant('simple')}
                className="flex items-center gap-2"
              >
                <Bot className="h-4 w-4" />
                AI Assistant
              </Button>
            )}
          </div>

          {/* Temporary Debug Display */}
          {session?.user?.role === 'admin' && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">🐛 Admin Debug Info:</h4>
              <div className="text-xs space-y-1 font-mono">
                <div>Session Role: {session?.user?.role || 'undefined'}</div>
                <div>Session Department: {session?.user?.department || 'undefined'}</div>
                <div>Is College Admin: {isCollegeAdmin ? 'YES' : 'NO'}</div>
                <div>Active Assistant: {activeAssistant}</div>
                <div>Departments Loaded: {departments.length}</div>
                <div>Selected Department: {selectedDepartment || 'none'}</div>
                <div>Loading: {loading ? 'YES' : 'NO'}</div>
                <div>Should Show Dropdown: {(isCollegeAdmin && activeAssistant === 'department') ? 'YES' : 'NO'}</div>
              </div>
            </div>
          )}

          {/* Department Selection - Only for College Admin when on Department Events */}
          {(() => {
            console.log('Rendering department dropdown check:', { isCollegeAdmin, activeAssistant, shouldShow: isCollegeAdmin && activeAssistant === 'department' });
            return null;
          })()}
          {isCollegeAdmin && activeAssistant === 'department' && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4" />
                <span className="font-medium">Select Department</span>
              </div>
              {loading ? (
                <div className="p-3 bg-muted rounded-md">Loading departments...</div>
              ) : departments.length === 0 ? (
                <div className="p-3 bg-red-100 border border-red-200 rounded-md text-red-700">
                  No departments found. Check console for errors.
                </div>
              ) : (
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Choose a department...</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.name}>
                      {dept.code} - {dept.name}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                Assistant will help with {selectedDepartment || 'selected'} department events
              </p>
            </div>
          )}

          {/* Department Filter for College Admin on College Events */}
          {isCollegeAdmin && activeAssistant === 'college' && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4" />
                <span className="font-medium">Filter College Events by Department</span>
              </div>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="" disabled>All departments...</option>
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.name}>
                    {dept.code} - {dept.name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-muted-foreground mt-2">
                {selectedDepartment 
                  ? `Viewing college events filtered for ${selectedDepartment}`
                  : 'Viewing college events from all departments'}
              </p>
            </div>
          )}

          {/* Department Info for Non-Admin Users */}
          {!isCollegeAdmin && activeAssistant === 'department' && selectedDepartment && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <School className="h-4 w-4" />
                <span className="font-medium">Your Department</span>
              </div>
              <div className="p-3 bg-muted rounded-md">
                <Badge variant="secondary" className="mr-2">
                  {departments.find(d => d.name === selectedDepartment)?.code || 'DEPT'}
                </Badge>
                {selectedDepartment}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Assistant will help with your {selectedDepartment} department events
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Assistant Content */}
      <div className="min-h-[600px]">
        {activeAssistant === 'college' ? (
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building className="h-5 w-5 text-blue-600" />
                College Events Assistant
                {isCollegeAdmin && selectedDepartment && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedDepartment}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CollegeEventChatbot 
                key={`college-${selectedDepartment}`}
                filterDepartment={isCollegeAdmin ? selectedDepartment : undefined}
              />
            </CardContent>
          </Card>
        ) : activeAssistant === 'department' ? (
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <School className="h-5 w-5 text-green-600" />
                {selectedDepartment ? `${selectedDepartment} Events Assistant` : 'Department Events Assistant'}
                {selectedDepartment && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedDepartment}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {selectedDepartment ? (
                <DepartmentEventChatbot 
                  key={`department-${selectedDepartment}`}
                  defaultDepartment={selectedDepartment} 
                />
              ) : (
                <div className="flex items-center justify-center h-48 text-muted-foreground">
                  <div className="text-center">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Please select a department to start chatting</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : activeAssistant === 'simple' ? (
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bot className="h-5 w-5 text-blue-600" />
                AI Assistant
                <Badge variant="secondary" className="ml-2">
                  {['student', 'STUDENT'].includes(session?.user?.role || '') ? 'Student Mode' : 'Teacher Mode'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <SimpleAIChatbot />
            </CardContent>
          </Card>
        ) : (
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <GraduationCap className="h-5 w-5 text-purple-600" />
                Subject Documents Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <SubjectChatbot 
                key="subject-assistant"
                selectedDepartment={isCollegeAdmin ? selectedDepartment : userDepartment}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}