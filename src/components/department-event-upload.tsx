'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, FileText, CheckCircle, AlertCircle, Building, Users } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface DepartmentEventUploadProps {
  className?: string
  onUploadSuccess?: () => void
  defaultDepartment?: string // For non-admin users
}

export default function DepartmentEventUpload({ className = '', onUploadSuccess, defaultDepartment }: DepartmentEventUploadProps) {
  const { data: session } = useSession()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [department, setDepartment] = useState(defaultDepartment || '')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')

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

  const allowedFileTypes = ['.pdf', '.doc', '.docx', '.txt']
  const maxFileSize = 10 * 1024 * 1024 // 10MB

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      // Check file type
      const fileExtension = '.' + selectedFile.name.split('.').pop()?.toLowerCase()
      if (!allowedFileTypes.includes(fileExtension)) {
        alert(`File type not allowed. Please use: ${allowedFileTypes.join(', ')}`)
        return
      }

      // Check file size
      if (selectedFile.size > maxFileSize) {
        alert('File size must be less than 10MB')
        return
      }

      setFile(selectedFile)
      setUploadStatus('idle')
    }
  }

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      alert('Please select a file and enter a title')
      return
    }

    if (!department) {
      alert('Please select a department')
      return
    }

    if (!session?.user) {
      alert('You must be logged in to upload documents')
      return
    }

    // Check if user has permission to upload
    const userRole = session.user.role
    console.log('User role:', userRole, 'Session:', session.user)
    
    if (!userRole || !['admin', 'teacher', 'department', 'department_admin'].includes(userRole.toLowerCase())) {
      alert(`Access denied. Your role: "${userRole}". Only admin, teacher, and department users can upload department event documents.`)
      return
    }

    setIsUploading(true)
    setUploadStatus('idle')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title.trim())
      formData.append('user_id', session.user.id || 'anonymous')
      formData.append('role', userRole)
      formData.append('event_type', 'department') // Always department event for department uploads
      formData.append('department', department)

      console.log('Sending department event upload request with:', {
        title: title.trim(),
        user_id: session.user.id,
        role: userRole,
        event_type: 'department',
        department: department,
        filename: file.name
      })

      const response = await fetch('http://localhost:8000/api/department-events/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        setUploadStatus('success')
        alert(`Department event document uploaded successfully to ${department} department!`)
        
        // Reset form
        setFile(null)
        setTitle('')
        if (!defaultDepartment) {
          setDepartment('')
        }
        
        // Reset file input
        const fileInput = document.getElementById('dept-file-upload') as HTMLInputElement
        if (fileInput) {
          fileInput.value = ''
        }

        // Call success callback
        onUploadSuccess?.()
      } else {
        const error = await response.json()
        throw new Error(error.detail || 'Upload failed')
      }
    } catch (error) {
      console.error('Department event upload error:', error)
      setUploadStatus('error')
      alert(error instanceof Error ? error.message : 'Failed to upload department event document')
    } finally {
      setIsUploading(false)
    }
  }

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Upload className="h-5 w-5" />
    }
  }

  const getStatusColor = () => {
    switch (uploadStatus) {
      case 'success':
        return 'border-green-200 bg-green-50 dark:bg-green-900/20'
      case 'error':
        return 'border-red-200 bg-red-50 dark:bg-red-900/20'
      default:
        return 'border-gray-200 bg-white dark:bg-gray-800'
    }
  }

  return (
    <div className={`${className} max-w-4xl mx-auto`}>
      <Card className="overflow-hidden shadow-2xl border-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl">
        {/* Enhanced Header with Animation */}
        <CardHeader className="relative bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 text-white p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-cyan-600/90 to-teal-600/90 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <CardTitle className="flex items-center space-x-3 text-2xl font-bold mb-2">
              <div className="p-2 bg-white/20 rounded-full">
                <Building className="h-6 w-6" />
              </div>
              <span>Upload Department Event Document</span>
            </CardTitle>
            <p className="text-blue-100 text-base leading-relaxed">
              Share department-specific events, announcements, and activities
            </p>
          </div>
          {/* Decorative Elements */}
          <div className="absolute top-4 right-4 opacity-20">
            <div className="w-20 h-20 border border-white/30 rounded-full"></div>
          </div>
          <div className="absolute bottom-2 right-8 opacity-10">
            <div className="w-12 h-12 border border-white/30 rounded-full"></div>
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-8">
          {/* Department Selection - Enhanced Design */}
          {!defaultDepartment && (
            <div className="space-y-3">
              <Label htmlFor="department" className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <Building className="h-5 w-5 text-blue-600" />
                <span>Department *</span>
              </Label>
              <select 
                value={department} 
                onChange={(e) => setDepartment(e.target.value)} 
                disabled={isUploading}
                className="w-full h-12 p-3 text-base border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white transition-all duration-200"
              >
                {departments.map((dept) => (
                  <option key={dept.value} value={dept.value}>
                    {dept.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* File Upload Area - Enhanced Design */}
          <div className="space-y-3">
            <Label htmlFor="dept-file-upload" className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span>Select Document</span>
            </Label>
            <div className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 ${getStatusColor()}`}>
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="p-4 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-2xl">
                    {getStatusIcon()}
                  </div>
                  {uploadStatus === 'success' && (
                    <div className="absolute -top-2 -right-2 animate-bounce">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <input
                    id="dept-file-upload"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="dept-file-upload"
                    className="cursor-pointer bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 inline-block shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Choose a file
                  </label>
                  <p className="text-gray-500 dark:text-gray-400"> or drag and drop</p>
                </div>
                
                <div className="bg-gray-50 dark:bg-slate-700 px-4 py-2 rounded-xl">
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                    PDF, DOC, DOCX, TXT files up to 10MB
                  </p>
                </div>
                
                {file && (
                  <div className="flex items-center space-x-3 bg-white dark:bg-slate-700 px-4 py-3 rounded-xl border border-blue-200 dark:border-blue-700 shadow-sm">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                      <p className="text-sm text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Form Fields */}
          <div className="grid gap-6">
            {/* Title Input - Full Width */}
            <div className="space-y-3">
              <Label htmlFor="dept-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                Document Title *
              </Label>
              <Input
                id="dept-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive title for the department document"
                disabled={isUploading}
                className="h-12 text-base border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 rounded-xl transition-all duration-200"
              />
            </div>
          </div>

          {/* Enhanced Upload Button */}
          <div className="pt-4">
            <Button
              onClick={handleUpload}
              disabled={!file || !title.trim() || !department || isUploading}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 hover:from-blue-700 hover:via-cyan-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-200 rounded-xl"
            >
              {isUploading ? (
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Uploading...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Upload className="h-5 w-5" />
                  <span>Upload Department Event Document</span>
                </div>
              )}
            </Button>
          </div>

          {/* Enhanced Info Section */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
            <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-4 text-lg flex items-center space-x-2">
              <div className="p-2 bg-blue-200 dark:bg-blue-800 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <span>About Department Event Documents</span>
            </h4>
            <div className="grid gap-3 text-sm text-blue-700 dark:text-blue-200">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>Documents uploaded here are accessible to department members only</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>Students, teachers, and department admins from this department can query these documents</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>Only admin, teachers, and department users can upload documents</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>All uploads are automatically processed for AI-powered department search</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>Documents are stored in department-specific vector databases</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}