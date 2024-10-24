import { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import clientPromise from '../../../../util/mongodb'
import bcrypt from 'bcryptjs'

export const authOptions: AuthOptions = {
    providers: [
      CredentialsProvider({
        name: "Credentials",
        credentials: {
          username: { label: "Username", type: "text", placeholder: "Имя" },
          password: { label: "Password", type: "password" }
        },
        async authorize(credentials) {
          if (!credentials?.username || !credentials?.password) {
            return null
          }
  
          const client = await clientPromise
          const database = client.db('users')
          const usersCollection = database.collection('users')
  
          const user = await usersCollection.findOne({ username: credentials.username })
  
          if (user && await bcrypt.compare(credentials.password, user.password)) {
            return { id: user._id.toString(), name: user.username, email: user.email }
          } else {
            return null
          }
        }
      })
    ],
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.id = user.id
        }
        return token
      },
      async session({ session, token }) {
        if (token) {
          session.user.id =  token.id as string;
        }
        return session
      },
    },
    pages: {
      signIn: '/auth/',
    }
  }