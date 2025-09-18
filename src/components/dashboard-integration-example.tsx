// Example integration for Admin Dashboard
// Add these imports to your admin dashboard component

import DocumentUpload from '@/components/document-upload'
import AiChat from '@/components/ai-chat'

// In your admin dashboard JSX, add these sections:

{/* Document Upload Section */}
{activeTab === 'documents' && (
  <div className="space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Upload Component */}
      <DocumentUpload 
        userRole="admin" 
        userId={session?.user?.id ? parseInt(session.user.id) : 1}
      />
      
      {/* Document List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {/* You can add a list of uploaded documents here */}
          <p className="text-gray-500 text-sm">
            Upload documents to see them listed here.
          </p>
        </CardContent>
      </Card>
    </div>
  </div>
)}

{/* AI Chat Section */}
{activeTab === 'chat' && (
  <div className="max-w-4xl mx-auto">
    <AiChat 
      userRole="admin"
      userId={session?.user?.id ? parseInt(session.user.id) : 1}
      assistantName="Admin AI Assistant"
    />
  </div>
)}

// Update your navigation tabs to include:
const navItems = [
  // ... existing items
  { 
    id: 'documents', 
    label: 'Documents', 
    icon: FileText, 
    color: 'text-orange-600 dark:text-orange-400' 
  },
  { 
    id: 'chat', 
    label: 'AI Chat', 
    icon: MessageCircle, 
    color: 'text-purple-600 dark:text-purple-400' 
  },
]
