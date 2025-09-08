'use client'

import { useEffect } from 'react'

export default function SocketIOSuppressor() {
  useEffect(() => {
    // Override console.error to filter out socket.io errors
    const originalError = console.error
    console.error = (...args) => {
      const message = args.join(' ')
      if (
        message.includes('socket.io') ||
        message.includes('EIO=4') ||
        message.includes('transport=polling')
      ) {
        return // Suppress socket.io related errors
      }
      originalError.apply(console, args)
    }

    // Block socket.io if it somehow gets loaded
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, 'io', {
        value: function() {
          return {
            on: () => {},
            off: () => {},
            emit: () => {},
            connect: () => {},
            disconnect: () => {},
            close: () => {}
          }
        },
        writable: false,
        configurable: false
      })
    }

    return () => {
      console.error = originalError
    }
  }, [])

  return null
}
