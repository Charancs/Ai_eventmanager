// Environment validation utility
export function validateEnv() {
  const requiredEnvVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL']
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
  }
}

// Call this in development
if (process.env.NODE_ENV === 'development') {
  try {
    validateEnv()
  } catch (error) {
    console.error('Environment validation failed:', error)
  }
}
