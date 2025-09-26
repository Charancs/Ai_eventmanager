'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, FileText, CheckCircle, AlertCircle, BookOpen, GraduationCap, Building, Calendar } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface SubjectDocumentUploadProps {
  className?: string
  onUploadSuccess?: () => void
}

interface Subject {
  name: string
  file_count: number
  path: string
}

interface Department {
  id: number
  name: string
  code: string
  description: string
  active: boolean
}

export default function SubjectDocumentUpload({ className = '', onUploadSuccess }: SubjectDocumentUploadProps) {
  const { data: session } = useSession()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [customSubject, setCustomSubject] = useState('')
  const [departments, setDepartments] = useState<Department[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false)

  const allowedFileTypes = ['.pdf', '.doc', '.docx', '.txt']
  const maxFileSize = 10 * 1024 * 1024 // 10MB

  // Load departments on component mount
  useEffect(() => {
    fetchDepartments()
  }, [])

  // Load subjects when department changes
  useEffect(() => {
    if (selectedDepartment) {
      fetchSubjects(selectedDepartment)
    } else {
      setSubjects([])
      setSelectedSubject('')
    }
  }, [selectedDepartment])

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
    if (!file || !title.trim() || !selectedDepartment) {
      alert('Please select a file, enter a title, and select a department')
      return
    }

    const finalSubject = selectedSubject === 'custom' ? customSubject.trim() : selectedSubject
    if (!finalSubject) {
      alert('Please select or enter a subject')
      return
    }

    if (!session?.user) {
      alert('You must be logged in to upload documents')
      return
    }

    // Check if user has permission to upload
    const userRole = session.user.role
    const allowedRoles = ['admin', 'teacher', 'department', 'department_admin']
    
    if (!userRole || !allowedRoles.includes(userRole.toLowerCase())) {
      alert(`Access denied. Your role: "${userRole}". Only admin, teacher, and department users can upload subject documents.`)
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
      formData.append('department', selectedDepartment)
      formData.append('subject', finalSubject)

      console.log('Uploading subject document:', {
        title: title.trim(),
        department: selectedDepartment,
        subject: finalSubject,
        filename: file.name,
        role: userRole
      })

      const response = await fetch('http://localhost:8000/api/documents/upload-subject', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        setUploadStatus('success')
        alert(`Subject document uploaded successfully for ${finalSubject}!`)
        
        // Reset form
        setFile(null)
        setTitle('')
        setSelectedSubject('')
        setCustomSubject('')
        
        // Reset file input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement
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
      console.error('Upload error:', error)
      setUploadStatus('error')
      alert(error instanceof Error ? error.message : 'Failed to upload document')
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
        return 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
    }
  }

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      <Card className="shadow-2xl border-0 bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20">
        <CardHeader className="pb-8">
          <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center justify-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <span>Upload Subject Document</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Enhanced File Upload Area */}
          <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${getStatusColor()}`}>
            <input
              id="file-upload"
              type="file"
              accept={allowedFileTypes.join(',')}
              onChange={handleFileChange}
              disabled={isUploading}
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center space-y-4"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-xl">
                {getStatusIcon()}
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Choose Subject Document
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Select a PDF, DOC, DOCX, or TXT file (max 10MB)
                </p>
              </div>
              {file && (
                <div className="mt-4 p-4 bg-white dark:bg-gray-700 rounded-xl shadow-md border border-gray-200 dark:border-gray-600 flex items-center space-x-3 max-w-full">
                  <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                    <p className="text-sm text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</p>
                  </div>
                </div>
              )}
            </label>
          </div>

          {/* Enhanced Form Fields */}
          <div className="space-y-6">
            {/* Department Selection */}
            <div className="space-y-3">
              <Label htmlFor="department" className="text-lg font-semibold text-gray-900 dark:text-white">
                Department *
              </Label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                disabled={isUploading}
                className="h-12 w-full px-3 py-2 text-base border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 rounded-xl bg-background ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Select department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Selection */}
            <div className="space-y-3">
              <Label htmlFor="subject" className="text-lg font-semibold text-gray-900 dark:text-white">
                Subject *
              </Label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={isUploading || isLoadingSubjects || !selectedDepartment}
                className="h-12 w-full px-3 py-2 text-base border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 rounded-xl bg-background ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">{isLoadingSubjects ? "Loading subjects..." : "Select subject"}</option>
                {subjects.map((subject) => (
                  <option key={subject.name} value={subject.name}>
                    {subject.name} ({subject.file_count} documents)
                  </option>
                ))}
                <option value="custom">+ Add New Subject</option>
              </select>
            </div>

            {/* Custom Subject Input */}
            {selectedSubject === 'custom' && (
              <div className="space-y-3">
                <Label htmlFor="customSubject" className="text-lg font-semibold text-gray-900 dark:text-white">
                  New Subject Name *
                </Label>
                <Input
                  id="customSubject"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Enter new subject name"
                  disabled={isUploading}
                  className="h-12 text-base border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 rounded-xl"
                />
              </div>
            )}

            {/* Title Input */}
            <div className="space-y-3">
              <Label htmlFor="title" className="text-lg font-semibold text-gray-900 dark:text-white">
                Document Title *
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive title for the document"
                disabled={isUploading}
                className="h-12 text-base border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 rounded-xl"
              />
            </div>
          </div>

          {/* Enhanced Upload Button */}
          <div className="pt-4">
            <Button
              onClick={handleUpload}
              disabled={!file || !title.trim() || !selectedDepartment || (!selectedSubject || (selectedSubject === 'custom' && !customSubject.trim())) || isUploading}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-200 rounded-xl"
            >
              {isUploading ? (
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Uploading...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Upload className="h-5 w-5" />
                  <span>Upload Subject Document</span>
                </div>
              )}
            </Button>
          </div>

          {/* Enhanced Info Section */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
            <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-4 text-lg flex items-center space-x-2">
              <div className="p-2 bg-blue-200 dark:bg-blue-800 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <span>About Subject Documents</span>
            </h4>
            <div className="grid gap-3 text-sm text-blue-700 dark:text-blue-200">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>Documents are organized by department and subject for easy access</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>Students can query these documents using the AI assistant</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>Only teachers and department admins can upload documents</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>All uploads are processed for AI-powered subject-specific queries</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 backdrop-blur-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-3 text-xl">
            <div className="p-2 bg-orange-200 dark:bg-orange-800 rounded-lg">
              <GraduationCap className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-orange-900 dark:text-orange-100">About Subject Documents</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm text-orange-700 dark:text-orange-200">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Documents uploaded here are organized by department and subject</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Students, teachers, and admins can access these documents through subject-wise queries</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Use clear, descriptive titles for better searchability</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>All uploads are automatically processed for AI-powered search</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Documents are stored in department-specific vector databases</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
