'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { FileText, Download, Search, Building, GraduationCap, Calendar, User, Loader2, Grid, List } from 'lucide-react'

interface Document {
  id: string
  filename: string
  original_filename: string
  department: string
  subject: string
  uploaded_at: string
  uploaded_by: string
  file_size?: number
  file_type?: string
}

interface SubjectInfo {
  subject: string
  document_count: number
}

interface SubjectDocumentViewProps {
  className?: string
  defaultDepartment?: string
}

export default function SubjectDocumentView({ className = '', defaultDepartment }: SubjectDocumentViewProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [subjects, setSubjects] = useState<SubjectInfo[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState(defaultDepartment || '')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [loading, setLoading] = useState(false)
  const [documentsLoading, setDocumentsLoading] = useState(false)

  const departments = [
    { value: '', label: 'Select Department' },
    { value: 'ComputerScience', label: 'Computer Science' },
    { value: 'Electronics', label: 'Electronics' },
    { value: 'Mechanical', label: 'Mechanical' },
    { value: 'Civil', label: 'Civil' },
    { value: 'Electrical', label: 'Electrical' },
    { value: 'IT', label: 'Information Technology' },
    { value: 'MBA', label: 'MBA' },
    { value: 'MCA', label: 'MCA' }
  ]

  // Fetch subjects when department changes
  useEffect(() => {
    if (selectedDepartment) {
      fetchSubjects()
    } else {
      setSubjects([])
      setSelectedSubject('')
      setDocuments([])
    }
  }, [selectedDepartment])

  // Fetch documents when subject changes
  useEffect(() => {
    if (selectedDepartment && selectedSubject) {
      fetchDocuments()
    } else {
      setDocuments([])
    }
  }, [selectedDepartment, selectedSubject])

  const fetchSubjects = async () => {
    if (!selectedDepartment) return

    setLoading(true)
    try {
      const response = await fetch(`http://localhost:8000/api/subjects/list/${selectedDepartment}`)
      if (response.ok) {
        const data = await response.json()
        setSubjects(data.subjects || [])
      } else {
        setSubjects([])
      }
    } catch (error) {
      console.error('Error fetching subjects:', error)
      setSubjects([])
    } finally {
      setLoading(false)
    }
  }

  const fetchDocuments = async () => {
    if (!selectedDepartment || !selectedSubject) return

    setDocumentsLoading(true)
    try {
      const response = await fetch(`http://localhost:8000/api/subject-documents/list/${selectedDepartment}/${selectedSubject}`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      } else {
        setDocuments([])
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
      setDocuments([])
    } finally {
      setDocumentsLoading(false)
    }
  }

  const handleDownload = async (document: Document) => {
    try {
      const response = await fetch(`http://localhost:8000/api/subject-documents/${document.department}/${document.subject}/${document.filename}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = window.document.createElement('a')
        a.href = url
        a.download = document.original_filename
        window.document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error downloading file:', error)
      alert('Error downloading file. Please try again.')
    }
  }

  const filteredDocuments = documents.filter(doc =>
    doc.original_filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.uploaded_by.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getFileIcon = (filename: string) => {
    return <FileText className="h-5 w-5 text-blue-500" />
  }

  return (
    <div className={`${className} max-w-7xl mx-auto space-y-6`}>
      {/* Header */}
      <Card className="overflow-hidden shadow-xl border-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl">
        <CardHeader className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-purple-600/90 to-indigo-600/90 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <CardTitle className="flex items-center space-x-3 text-2xl font-bold mb-2">
              <div className="p-2 bg-white/20 rounded-full">
                <FileText className="h-6 w-6" />
              </div>
              <span>Subject Documents</span>
            </CardTitle>
            <p className="text-blue-100 text-base leading-relaxed">
              Browse and download academic documents by department and subject
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          {/* Filters */}
          <div className="grid gap-6 md:grid-cols-3 mb-6">
            {/* Department Selection */}
            {!defaultDepartment && (
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center space-x-2">
                  <Building className="h-4 w-4 text-blue-500" />
                  <span>Department</span>
                </Label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="h-10 w-full px-3 py-2 bg-background border border-input rounded-md text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {departments.map((dept) => (
                    <option key={dept.value} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Subject Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center space-x-2">
                <GraduationCap className="h-4 w-4 text-purple-500" />
                <span>Subject</span>
              </Label>
              <select
                value={selectedSubject} 
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={!selectedDepartment || loading}
                className="h-10 w-full px-3 py-2 bg-background border border-input rounded-md text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">{loading ? "Loading..." : "Select Subject"}</option>
                <option value="">All Subjects</option>
                {subjects.map((subject) => (
                  <option key={subject.subject} value={subject.subject}>
                    {subject.subject} ({subject.document_count})
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center space-x-2">
                <Search className="h-4 w-4 text-green-500" />
                <span>Search Documents</span>
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by filename or uploader..."
                  className="pl-10 h-10"
                />
              </div>
            </div>
          </div>

          {/* View Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-sm">
                {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
              </Badge>
              {selectedSubject && (
                <Badge variant="secondary" className="text-sm">
                  {selectedSubject}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {documentsLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading documents...</span>
              </div>
            </div>
          )}

          {/* Documents Display */}
          {!documentsLoading && (
            <>
              {filteredDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-500 mb-2">No Documents Found</h3>
                  <p className="text-gray-400">
                    {!selectedDepartment 
                      ? "Please select a department to view documents"
                      : !selectedSubject
                      ? "Please select a subject to view documents"
                      : "No documents available for the selected criteria"}
                  </p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredDocuments.map((doc) => (
                    <Card key={doc.id} className="group hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            {getFileIcon(doc.original_filename)}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                                {doc.original_filename}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1">
                                {doc.subject}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-xs text-gray-500 mb-4">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>{doc.uploaded_by}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(doc.uploaded_at)}</span>
                            </span>
                          </div>
                          {doc.file_size && (
                            <p className="text-right">{formatFileSize(doc.file_size)}</p>
                          )}
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleDownload(doc)}
                            size="sm"
                            className="flex-1 h-8"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredDocuments.map((doc) => (
                    <Card key={doc.id} className="group hover:shadow-md transition-all duration-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1 min-w-0">
                            {getFileIcon(doc.original_filename)}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                {doc.original_filename}
                              </h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                                <span>{doc.subject}</span>
                                <span>•</span>
                                <span>{doc.uploaded_by}</span>
                                <span>•</span>
                                <span>{formatDate(doc.uploaded_at)}</span>
                                {doc.file_size && (
                                  <>
                                    <span>•</span>
                                    <span>{formatFileSize(doc.file_size)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Button
                              onClick={() => handleDownload(doc)}
                              size="sm"
                              variant="outline"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
