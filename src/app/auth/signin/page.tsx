'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  MessageCircle, 
  Eye, 
  EyeOff, 
  Moon, 
  Sun, 
  ArrowLeft, 
  Bot, 
  Shield, 
  Mail, 
  Lock,
  GraduationCap,
  Users,
  BookOpen,
  Brain,
  Zap,
  CheckCircle,
  Star
} from 'lucide-react'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })

      if (result?.error) {
        setError('Invalid credentials. Please check your email and password.')
      } else {
        const session = await getSession()
        if (session?.user?.role) {
          // Redirect based on role
          switch (session.user.role) {
            case 'ADMIN':
              router.push('/admin/dashboard')
              break
            case 'DEPARTMENT_ADMIN':
              router.push('/department/dashboard')
              break
            case 'TEACHER':
              router.push('/teacher/dashboard')
              break
            case 'STUDENT':
              router.push('/student/dashboard')
              break
            default:
              router.push('/dashboard')
          }
        }
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
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

        <Card className="backdrop-blur-sm bg-card/80 border shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Bot className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">
                Welcome Back
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                Sign in to your College AI Assistant account
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-11"
                    placeholder="Enter your email"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 pr-10 h-11"
                    placeholder="Enter your password"
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
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-destructive text-sm flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    {error}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 font-medium"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing In...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">New to our platform?</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account yet?{' '}
                <button
                  onClick={() => router.push('/auth/signup')}
                  className="text-primary hover:underline font-medium"
                >
                  Create account
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features showcase */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-card/40 backdrop-blur-sm border">
            <GraduationCap className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground font-medium">Academic</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-card/40 backdrop-blur-sm border">
            <Zap className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground font-medium">Smart AI</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-card/40 backdrop-blur-sm border">
            <Users className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground font-medium">Community</p>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-6 p-4 rounded-lg bg-muted/20 backdrop-blur-sm border border-muted/30">
          <div className="flex items-center justify-center space-x-6 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Secure Login</span>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="h-3 w-3 text-yellow-500" />
              <span>AI Powered</span>
            </div>
            <div className="flex items-center space-x-1">
              <Brain className="h-3 w-3 text-blue-500" />
              <span>Smart Assistant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
