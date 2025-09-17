'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react'

interface DocumentUploadProps {
  userRole?: string
  userId?: number
}

export default function DocumentUpload({ userRole = 'admin', userId = 1 }: DocumentUploadProps) {
  const { data: session } = useSession()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')

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

    const currentUserId = userId || session?.user?.id || 1

    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title.trim())
      formData.append('user_id', currentUserId.toString())
      formData.append('role', userRole)

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch('http://localhost:8000/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const result = await response.json()

      if (response.ok && result.success) {
        setUploadStatus('success')
        setStatusMessage(`Document processed successfully! Created ${result.data.chunk_count} chunks for search.`)
        
        // Reset form after delay
        setTimeout(() => {
          setFile(null)
          setTitle('')
          setUploadStatus('idle')
          setStatusMessage('')
          setUploadProgress(0)
          // Reset file input
          const fileInput = document.getElementById('file-upload') as HTMLInputElement
          if (fileInput) fileInput.value = ''
        }, 3000)
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
