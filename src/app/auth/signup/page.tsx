'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Eye, 
  EyeOff, 
  Moon, 
  Sun, 
  ArrowLeft, 
  Bot, 
  Shield, 
  Mail, 
  Lock, 
  User, 
  Building, 
  GraduationCap,
  CheckCircle,
  Users,
  BookOpen,
  Brain,
  Zap,
  Star,
  ArrowRight,
  UserCheck,
  School,
  Award,
  Briefcase
} from 'lucide-react'

const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Electronics',
  'Mechanical',
  'Civil',
  'Electrical',
  'Chemical',
  'Other'
]

const YEARS = ['1', '2', '3', '4']

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT',
    department: '',
    year: '',
    rollNo: '',
    employeeId: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    year: '',
    rollNo: '',
    employeeId: ''
  })
  const [touchedFields, setTouchedFields] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
    department: false,
    year: false,
    rollNo: false,
    employeeId: false
  })
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  const validateField = (fieldName: string, value: string) => {
    let error = ''
    
    switch (fieldName) {
      case 'name':
        if (!value.trim()) {
          error = 'Full name is required'
        } else if (value.trim().length < 2) {
          error = 'Name must be at least 2 characters long'
        } else if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
          error = 'Name can only contain letters and spaces'
        }
        break
      case 'email':
        if (!value) {
          error = 'Email is required'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Please enter a valid email address'
        }
        break
      case 'password':
        if (!value) {
          error = 'Password is required'
        } else if (value.length < 8) {
          error = 'Password must be at least 8 characters long'
        } else if (!/(?=.*[a-z])/.test(value)) {
          error = 'Password must contain at least one lowercase letter'
        } else if (!/(?=.*[A-Z])/.test(value)) {
          error = 'Password must contain at least one uppercase letter'
        } else if (!/(?=.*\d)/.test(value)) {
          error = 'Password must contain at least one number'
        }
        break
      case 'confirmPassword':
        if (!value) {
          error = 'Please confirm your password'
        } else if (value !== formData.password) {
          error = 'Passwords do not match'
        }
        break
      case 'department':
        if (!value) {
          error = 'Please select a department'
        }
        break
      case 'year':
        if (formData.role === 'STUDENT' && !value) {
          error = 'Please select your academic year'
        }
        break
      case 'rollNo':
        if (formData.role === 'STUDENT' && !value.trim()) {
          error = 'USN is required'
        } else if (formData.role === 'STUDENT' && value.trim().length < 3) {
          error = 'USN must be at least 3 characters'
        } else if (formData.role === 'STUDENT' && !/^[a-zA-Z0-9]+$/.test(value.trim())) {
          error = 'USN can only contain letters and numbers'
        }
        break
      case 'employeeId':
        if ((formData.role === 'TEACHER' || formData.role === 'DEPARTMENT_ADMIN') && !value.trim()) {
          error = 'Employee ID is required'
        } else if ((formData.role === 'TEACHER' || formData.role === 'DEPARTMENT_ADMIN') && value.trim().length < 3) {
          error = 'Employee ID must be at least 3 characters'
        } else if ((formData.role === 'TEACHER' || formData.role === 'DEPARTMENT_ADMIN') && !/^[a-zA-Z0-9-]+$/.test(value.trim())) {
          error = 'Employee ID can only contain letters, numbers, and hyphens'
        }
        break
    }
    
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: error
    }))
    
    return error === ''
  }

  const handleFieldBlur = (fieldName: string) => {
    setTouchedFields(prev => ({
      ...prev,
      [fieldName]: true
    }))
    validateField(fieldName, formData[fieldName as keyof typeof formData])
  }

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }))
    
    // If field was touched, validate on change
    if (touchedFields[fieldName as keyof typeof touchedFields]) {
      validateField(fieldName, value)
    }
    
    // Special case for confirm password - validate when password changes
    if (fieldName === 'password' && touchedFields.confirmPassword) {
      validateField('confirmPassword', formData.confirmPassword)
    }
  }

  const validateStep1 = () => {
    const isValid = formData.name && 
                   formData.email && 
                   formData.password && 
                   formData.confirmPassword && 
                   formData.role &&
                   !fieldErrors.name &&
                   !fieldErrors.email &&
                   !fieldErrors.password &&
                   !fieldErrors.confirmPassword
    return isValid
  }

  const validateStep2 = () => {
    if (formData.role === 'STUDENT') {
      return formData.department && 
             formData.year && 
             formData.rollNo &&
             !fieldErrors.department &&
             !fieldErrors.year &&
             !fieldErrors.rollNo
    } else if (formData.role === 'TEACHER' || formData.role === 'DEPARTMENT_ADMIN') {
      return formData.department && 
             formData.employeeId &&
             !fieldErrors.department &&
             !fieldErrors.employeeId
    }
    return formData.department && !fieldErrors.department
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          department: formData.department,
          year: formData.year,
          rollNo: formData.rollNo,
          employeeId: formData.employeeId
        })
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/auth/signin?message=Account created successfully')
      } else {
        setError(data.message || 'An error occurred during registration')
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'STUDENT':
        return <GraduationCap className="h-5 w-5" />
      case 'TEACHER':
        return <BookOpen className="h-5 w-5" />
      case 'DEPARTMENT_ADMIN':
        return <Building className="h-5 w-5" />
      case 'ADMIN':
        return <Shield className="h-5 w-5" />
      default:
        return <User className="h-5 w-5" />
    }
  }

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'STUDENT':
        return 'Access academic resources, announcements, and AI assistance'
      case 'TEACHER':
        return 'Manage classes, create announcements, and interact with students'
      case 'DEPARTMENT_ADMIN':
        return 'Oversee department communications and manage faculty'
      case 'ADMIN':
        return 'Full system access and management capabilities'
      default:
        return ''
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 py-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/3 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>

        <Card className="backdrop-blur-sm bg-card/80 border shadow-2xl overflow-hidden">
          <CardHeader className="text-center space-y-3 pb-4">
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">
                Join Our Community
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                Create your College AI Assistant account
              </p>
            </div>
            
            {/* Progress indicator */}
            <div className="flex items-center justify-center space-x-2 mt-3">
              <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`}></div>
              <div className={`w-8 h-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
              <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4 px-6 pb-6 overflow-hidden">
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      onBlur={() => handleFieldBlur('name')}
                      required
                      className={`pl-10 h-11 ${fieldErrors.name && touchedFields.name ? 'border-destructive focus:border-destructive' : ''}`}
                      placeholder="Enter your full name"
                    />
                  </div>
                  {fieldErrors.name && touchedFields.name && (
                    <p className="text-destructive text-xs mt-1">{fieldErrors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      onBlur={() => handleFieldBlur('email')}
                      required
                      className={`pl-10 h-11 ${fieldErrors.email && touchedFields.email ? 'border-destructive focus:border-destructive' : ''}`}
                      placeholder="Enter your email"
                    />
                  </div>
                  {fieldErrors.email && touchedFields.email && (
                    <p className="text-destructive text-xs mt-1">{fieldErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-medium">
                    Your Role
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {['STUDENT', 'TEACHER', 'DEPARTMENT_ADMIN', 'ADMIN'].map((role) => (
                      <div
                        key={role}
                        onClick={() => {
                          setFormData({ ...formData, role })
                          // Reset role-specific field errors when role changes
                          setFieldErrors(prev => ({
                            ...prev,
                            year: '',
                            rollNo: '',
                            employeeId: ''
                          }))
                        }}
                        className={`p-2 border rounded-lg cursor-pointer transition-all hover:border-primary/50 ${
                          formData.role === role 
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                            : 'border-muted hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <div className={`text-${formData.role === role ? 'primary' : 'muted-foreground'}`}>
                            {getRoleIcon(role)}
                          </div>
                          <span className="text-xs font-medium capitalize">
                            {role.toLowerCase().replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getRoleDescription(formData.role)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleFieldChange('password', e.target.value)}
                        onBlur={() => handleFieldBlur('password')}
                        required
                        className={`pl-10 pr-10 h-11 ${fieldErrors.password && touchedFields.password ? 'border-destructive focus:border-destructive' : ''}`}
                        placeholder="Password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-11 w-11"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {fieldErrors.password && touchedFields.password && (
                      <p className="text-destructive text-xs mt-1">{fieldErrors.password}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">
                      Confirm
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                        onBlur={() => handleFieldBlur('confirmPassword')}
                        required
                        className={`pl-10 pr-10 h-11 ${fieldErrors.confirmPassword && touchedFields.confirmPassword ? 'border-destructive focus:border-destructive' : ''}`}
                        placeholder="Confirm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-11 w-11"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {fieldErrors.confirmPassword && touchedFields.confirmPassword && (
                      <p className="text-destructive text-xs mt-1">{fieldErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!validateStep1()}
                  className="w-full h-11 font-medium mt-4"
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="department" className="text-sm font-medium">
                    Department
                  </Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <select
                      id="department"
                      value={formData.department}
                      onChange={(e) => handleFieldChange('department', e.target.value)}
                      onBlur={() => handleFieldBlur('department')}
                      required
                      className={`w-full h-11 pl-10 pr-4 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent ${
                        fieldErrors.department && touchedFields.department ? 'border-destructive focus:border-destructive' : ''
                      }`}
                    >
                      <option value="">Select your department</option>
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  {fieldErrors.department && touchedFields.department && (
                    <p className="text-destructive text-xs mt-1">{fieldErrors.department}</p>
                  )}
                </div>

                {formData.role === 'STUDENT' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="year" className="text-sm font-medium">
                        Academic Year
                      </Label>
                      <div className="grid grid-cols-4 gap-2">
                        {YEARS.map((year) => (
                          <div
                            key={year}
                            onClick={() => {
                              handleFieldChange('year', year)
                              handleFieldBlur('year')
                            }}
                            className={`p-2 border rounded-lg cursor-pointer text-center transition-all hover:border-primary/50 ${
                              formData.year === year 
                                ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                                : 'border-muted hover:bg-muted/50'
                            } ${
                              fieldErrors.year && touchedFields.year ? 'border-destructive' : ''
                            }`}
                          >
                            <span className="text-sm font-medium">Year {year}</span>
                          </div>
                        ))}
                      </div>
                      {fieldErrors.year && touchedFields.year && (
                        <p className="text-destructive text-xs mt-1">{fieldErrors.year}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rollNo" className="text-sm font-medium">
                        USN
                      </Label>
                      <div className="relative">
                        <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="rollNo"
                          type="text"
                          value={formData.rollNo}
                          onChange={(e) => handleFieldChange('rollNo', e.target.value)}
                          onBlur={() => handleFieldBlur('rollNo')}
                          required
                          className={`pl-10 h-11 ${fieldErrors.rollNo && touchedFields.rollNo ? 'border-destructive focus:border-destructive' : ''}`}
                          placeholder="Enter your USN"
                        />
                      </div>
                      {fieldErrors.rollNo && touchedFields.rollNo && (
                        <p className="text-destructive text-xs mt-1">{fieldErrors.rollNo}</p>
                      )}
                    </div>
                  </>
                )}

                {(formData.role === 'TEACHER' || formData.role === 'DEPARTMENT_ADMIN') && (
                  <div className="space-y-2">
                    <Label htmlFor="employeeId" className="text-sm font-medium">
                      Employee ID
                    </Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="employeeId"
                        type="text"
                        value={formData.employeeId}
                        onChange={(e) => handleFieldChange('employeeId', e.target.value)}
                        onBlur={() => handleFieldBlur('employeeId')}
                        required
                        className={`pl-10 h-11 ${fieldErrors.employeeId && touchedFields.employeeId ? 'border-destructive focus:border-destructive' : ''}`}
                        placeholder="Enter your employee ID"
                      />
                    </div>
                    {fieldErrors.employeeId && touchedFields.employeeId && (
                      <p className="text-destructive text-xs mt-1">{fieldErrors.employeeId}</p>
                    )}
                  </div>
                )}

                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                    <p className="text-destructive text-sm flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      {error}
                    </p>
                  </div>
                )}

                <div className="flex space-x-3 mt-4 w-full">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 h-11"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={!validateStep2() || loading}
                    className="flex-1 h-11 font-medium"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        <span>Creating...</span>
                      </div>
                    ) : (
                      <>
                        Create Account
                        <UserCheck className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Always visible sign-in link section */}
            <div className="mt-6 pt-4 border-t border-muted">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <button
                    onClick={() => router.push('/auth/signin')}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign in here
                  </button>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Simplified benefits showcase */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="text-center p-2 rounded-lg bg-card/40 backdrop-blur-sm border">
            <Brain className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground font-medium">AI Assistant</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-card/40 backdrop-blur-sm border">
            <School className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground font-medium">Smart Campus</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-card/40 backdrop-blur-sm border">
            <Users className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground font-medium">Connected</p>
          </div>
        </div>
      </div>
    </div>
  )
}
