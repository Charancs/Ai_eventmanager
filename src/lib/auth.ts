import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (!user) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            department: user.department,
            year: user.year,
            rollNo: user.rollNo,
            employeeId: user.employeeId
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.department = user.department
        token.year = user.year
        token.rollNo = user.rollNo
        token.employeeId = user.employeeId
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.department = token.department as string
        session.user.year = token.year as string
        session.user.rollNo = token.rollNo as string
        session.user.employeeId = token.employeeId as string
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signin'
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development'
}
