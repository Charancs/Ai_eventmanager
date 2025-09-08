'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export function AuthDebug() {
  const { data: session, status } = useSession()
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    setDebugInfo({
      status,
      session,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      timestamp: new Date().toISOString()
    })
  }, [session, status])

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded text-xs max-w-sm">
      <h4 className="font-bold mb-2">Auth Debug Info</h4>
      <pre className="whitespace-pre-wrap">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  )
}
