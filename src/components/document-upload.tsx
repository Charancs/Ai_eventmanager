'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, FileText, CheckCircle, AlertCircle, X, Plus, FolderPlus, BookOpen } from 'lucide-react'

interface Subject {
  name: string
  file_count: number
  path: string
}

interface DocumentUploadProps {
  userRole?: string
  userId?: string
}

export default function DocumentUpload({ userRole = 'admin', userId = '1' }: DocumentUploadProps) {
  const { data: session } = useSession()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  // New: Store extracted event info from backend/agent
  const [eventSummary, setEventSummary] = useState<null | { events_extracted: number, events_stored: number, storage_results: string[], messages: string[] }>(null)
  const [uploadMode, setUploadMode] = useState<'general' | 'subject'>('general')
  
  // Subject-related state
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [newSubjectName, setNewSubjectName] = useState('')
  const [showNewSubjectInput, setShowNewSubjectInput] = useState(false)
  const [creatingSubject, setCreatingSubject] = useState(false)
  const [loadingSubjects, setLoadingSubjects] = useState(false)

  const currentDepartment = session?.user?.department || (userRole === 'admin' ? 'admin' : 'Computer Science')

  // Load subjects when component mounts or department changes
  useEffect(() => {
    if (uploadMode === 'subject') {
      loadSubjects()
    }
  }, [uploadMode, currentDepartment])

  const loadSubjects = async () => {
    setLoadingSubjects(true)
    try {
      const response = await fetch(`http://localhost:8000/api/subjects/${encodeURIComponent(currentDepartment)}`)
      if (response.ok) {
        const result = await response.json()
        setSubjects(result.subjects || [])
      } else {
        console.error('Failed to load subjects')
      }
    } catch (error) {
      console.error('Error loading subjects:', error)
    } finally {
      setLoadingSubjects(false)
    }
  }

  const createNewSubject = async () => {
    if (!newSubjectName.trim()) {
      setUploadStatus('error')
      setStatusMessage('Please enter a subject name')
      return
    }

    setCreatingSubject(true)
    try {
      const response = await fetch('http://localhost:8000/api/subjects/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject_name: newSubjectName.trim(),
          department: currentDepartment
        })
      })

      if (response.ok) {
        const result = await response.json()
        setSubjects(prev => [...prev, result.subject])
        setSelectedSubject(newSubjectName.trim())
        setNewSubjectName('')
        setShowNewSubjectInput(false)
        setUploadStatus('success')
        setStatusMessage(`Subject "${newSubjectName.trim()}" created successfully!`)
      } else {
        const error = await response.json()
        setUploadStatus('error')
        setStatusMessage(error.detail || 'Failed to create subject')
      }
    } catch (error) {
      setUploadStatus('error')
      setStatusMessage('Error creating subject')
    } finally {
      setCreatingSubject(false)
    }
  }

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
      if (!allowedTypes.includes(selectedFile.type)) {
        setUploadStatus('error')
        setStatusMessage('Please select a PDF, DOC, DOCX, or TXT file')
        return
      }

      // Validate file size (10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setUploadStatus('error')
        setStatusMessage('File size must be less than 10MB')
        return
      }

      setFile(selectedFile)
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, '')) // Remove extension for default title
      setUploadStatus('idle')
      setStatusMessage('')
    }
  }, [])

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      setUploadStatus('error')
      setStatusMessage('Please select a file and enter a title')
      return
    }

    // Validate subject selection for subject mode
    if (uploadMode === 'subject' && !selectedSubject) {
      setUploadStatus('error')
      setStatusMessage('Please select a subject or create a new one')
      return
    }

    // Check if user is authenticated
    if (!session && !userId) {
      setUploadStatus('error')
      setStatusMessage('Please log in to upload documents')
      return
    }

    const currentUserId = userId?.toString() || session?.user?.id || '1'
    const currentRole = userRole || session?.user?.role || 'admin'

    console.log('Upload data:', { currentUserId, currentRole, currentDepartment, uploadMode, selectedSubject }) // Debug log

    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title.trim())
      formData.append('user_id', currentUserId)
      formData.append('role', currentRole)
      formData.append('department', currentDepartment)

      // Add subject for subject-specific uploads
      if (uploadMode === 'subject' && selectedSubject) {
        formData.append('subject', selectedSubject)
      }

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      // Choose endpoint based on upload mode
      const endpoint = uploadMode === 'subject' 
        ? 'http://localhost:8000/api/documents/upload-subject'
        : 'http://localhost:8000/api/documents/upload'

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const result = await response.json()

      if (response.ok && result.success) {
        setUploadStatus('success')
        const baseMessage = `Document processed successfully! Created ${result.data.chunk_count} chunks for search.`
        const subjectMessage = uploadMode === 'subject' ? ` Uploaded to ${selectedSubject} subject.` : ''
        setStatusMessage(baseMessage + subjectMessage)

        // New: Show event extraction summary if present
        if (result.data && result.data.event_agent_result) {
          setEventSummary({
            events_extracted: result.data.event_agent_result.events_extracted,
            events_stored: result.data.event_agent_result.events_stored,
            storage_results: result.data.event_agent_result.storage_results,
            messages: result.data.event_agent_result.messages,
          })
        } else {
          setEventSummary(null)
        }

        // Refresh subjects list if in subject mode
        if (uploadMode === 'subject') {
          loadSubjects()
        }

        // Reset form after delay
        setTimeout(() => {
          setFile(null)
          setTitle('')
          setUploadStatus('idle')
          setStatusMessage('')
          setUploadProgress(0)
          setEventSummary(null)
          // Reset file input
          const fileInput = document.getElementById('file-upload') as HTMLInputElement
          if (fileInput) fileInput.value = ''
        }, 5000)
      } else {
        throw new Error(result.detail || 'Upload failed')
      }
    } catch (error) {
      setUploadStatus('error')
      setStatusMessage(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const clearFile = () => {
    setFile(null)
    setTitle('')
    setUploadStatus('idle')
    setStatusMessage('')
    setUploadProgress(0)
    // Reset file input
    const fileInput = document.getElementById('file-upload') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-blue-500" />
          Upload Documents for AI Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Area */}
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
          {!file ? (
            <div>
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Click to upload or drag and drop
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Supported formats: PDF, DOC, DOCX, TXT (Max 10MB)
              </p>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <Label htmlFor="file-upload">
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>Choose File</span>
                </Button>
              </Label>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-500" />
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={clearFile}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Title Input */}
        {file && (
          <>
            <div>
              <Label htmlFor="title">Document Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive title for this document"
                className="mt-1"
              />
            </div>

            {/* Upload Mode Selection */}
            <div>
              <Label>Upload Type</Label>
              <div className="flex gap-4 mt-2">
                <Button
                  type="button"
                  variant={uploadMode === 'general' ? 'default' : 'outline'}
                  onClick={() => setUploadMode('general')}
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  General Upload
                </Button>
                <Button
                  type="button"
                  variant={uploadMode === 'subject' ? 'default' : 'outline'}
                  onClick={() => setUploadMode('subject')}
                  className="flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  Subject Specific
                </Button>
              </div>
            </div>

            {/* Subject Selection for Subject Mode */}
            {uploadMode === 'subject' && (
              <div className="space-y-4">
                <div>
                  <Label>Select Subject</Label>
                  <div className="flex gap-2 mt-2">
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      disabled={loadingSubjects}
                    >
                      <option value="">
                        {loadingSubjects ? 'Loading subjects...' : 'Select a subject'}
                      </option>
                      {subjects.map((subject) => (
                        <option key={subject.name} value={subject.name}>
                          {subject.name} ({subject.file_count} files)
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewSubjectInput(!showNewSubjectInput)}
                      className="px-3"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* New Subject Creation */}
                {showNewSubjectInput && (
                  <div className="flex gap-2">
                    <Input
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      placeholder="Enter new subject name"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={createNewSubject}
                      disabled={creatingSubject || !newSubjectName.trim()}
                      className="flex items-center gap-2"
                    >
                      <FolderPlus className="w-4 h-4" />
                      Create
                    </Button>
                  </div>
                )}

                {/* Subject Info */}
                {selectedSubject && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>Department:</strong> {currentDepartment}
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>Subject:</strong> {selectedSubject}
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>Files in subject:</strong> {subjects.find(s => s.name === selectedSubject)?.file_count || 0}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Processing document...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {statusMessage && (
          <div className={`p-3 rounded-lg flex items-center gap-2 ${uploadStatus === 'error' ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-green-50 border border-green-200 text-green-800'}`}>
            {uploadStatus === 'error' ? (
              <AlertCircle className="h-4 w-4 text-red-600" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
            <span className="text-sm">{statusMessage}</span>
          </div>
        )}

        {/* Upload Button */}
        <Button 
          onClick={handleUpload}
          disabled={!file || !title.trim() || uploading}
          className="w-full"
        >
          {uploading ? 'Processing...' : 'Upload & Process Document'}
        </Button>

        {/* Event Extraction Summary (if available) */}
        {eventSummary && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="font-semibold mb-2 text-blue-800 dark:text-blue-200">Event Extraction Results</div>
            <div className="text-sm text-blue-900 dark:text-blue-100 mb-1">Events Extracted: <strong>{eventSummary.events_extracted}</strong></div>
            <div className="text-sm text-blue-900 dark:text-blue-100 mb-1">Events Stored: <strong>{eventSummary.events_stored}</strong></div>
            {eventSummary.storage_results.length > 0 && (
              <ul className="list-disc ml-6 text-xs text-blue-900 dark:text-blue-100">
                {eventSummary.storage_results.map((msg, idx) => (
                  <li key={idx}>{msg}</li>
                ))}
              </ul>
            )}
            {eventSummary.messages.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-blue-700 dark:text-blue-300">Agent Messages</summary>
                <ul className="list-disc ml-6 text-xs">
                  {eventSummary.messages.map((msg, idx) => (
                    <li key={idx}>{msg}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        {/* Info */}
        <div className="text-sm text-gray-500 space-y-1">
          <p>• Documents are processed and stored securely in your personal space</p>
          <p>• AI will use these documents to answer your questions</p>
          <p>• Text is split into chunks for better search accuracy</p>
          <p>• Role: {userRole} | User ID: {userId || session?.user?.id || 1}</p>
        </div>
      </CardContent>
    </Card>
  )
}
