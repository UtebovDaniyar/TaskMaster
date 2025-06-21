import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { loginSchema } from "@/features/auth/schemas"

// Тип пользователя с паролем
type UserWithPassword = {
  id: string;
  name: string | null;
  email: string;
  password: string | null;
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const validatedFields = loginSchema.safeParse(credentials);
          
          if (!validatedFields.success) {
            return null;
          }

          const { email, password } = validatedFields.data;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const user = await (prisma.user.findUnique as any)({
            where: { email },
            select: {
              id: true,
              name: true,
              email: true,
              password: true,
            }
          }) as UserWithPassword | null;

          if (!user || !user.password) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(password, user.password);

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 дней
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 дней
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string
      }
      return session
    },
    authorized({ auth }) {
      return !!auth
    },
  },
  pages: {
    signIn: "/sign-in",
    signOut: "/sign-in",
    error: "/error",
  },
  events: {
    async signOut() {
      // Дополнительная очистка при выходе
      console.log("Пользователь успешно вышел из системы")
    },
  },
  // Дополнительные настройки для корректного logout
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  // Отключаем автоматическое обновление сессии на клиенте
  useSecureCookies: process.env.NODE_ENV === "production",
}) 