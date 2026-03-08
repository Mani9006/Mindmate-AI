import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"

export const authConfig: NextAuthOptions = {
  providers: [
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),

    // GitHub OAuth
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    }),

    // Credentials (Email/Password)
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // TODO: Implement actual authentication logic
        // This is a placeholder - replace with your actual auth logic
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Example: Validate against your database
        // const user = await db.user.findUnique({ where: { email: credentials.email } })
        // if (user && await verifyPassword(credentials.password, user.password)) {
        //   return { id: user.id, email: user.email, name: user.name, image: user.image }
        // }

        // For demo purposes, return a mock user
        if (
          credentials.email === "demo@example.com" &&
          credentials.password === "password"
        ) {
          return {
            id: "1",
            email: "demo@example.com",
            name: "Demo User",
            image: null,
          }
        }

        return null
      },
    }),
  ],

  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
    newUser: "/onboarding",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async jwt({ token, user, account, profile }) {
      // Persist user data to token
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.image = user.image
      }

      // Handle OAuth provider data
      if (account) {
        token.provider = account.provider
        token.accessToken = account.access_token
      }

      return token
    },

    async session({ session, token }) {
      // Send token data to session
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email
        session.user.name = token.name
        session.user.image = token.image as string | null
      }
      return session
    },

    async signIn({ user, account, profile }) {
      // Allow all sign-ins for now
      // Add custom logic here if needed (e.g., check if user exists in DB)
      return true
    },

    async redirect({ url, baseUrl }) {
      // Redirect to home after sign in
      if (url.startsWith(baseUrl)) return url
      if (url.startsWith("/")) return `${baseUrl}${url}`
      return baseUrl
    },
  },

  events: {
    async signIn({ user, account, profile }) {
      console.log("User signed in:", user.email)
      // TODO: Add user to database if not exists
    },
    async signOut({ token }) {
      console.log("User signed out:", token.email)
    },
    async createUser({ user }) {
      console.log("New user created:", user.email)
      // TODO: Send welcome email, etc.
    },
  },

  debug: process.env.NODE_ENV === "development",
}
