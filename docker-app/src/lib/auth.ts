import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (!creds?.username || !creds?.password) return null;
        const user = await prisma.user.findUnique({
          where: { username: creds.username.toLowerCase() },
        });
        if (!user) return null;
        const ok = await bcrypt.compare(creds.password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, name: user.fullName, email: user.username, role: user.role } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = (user as any).id;
        token.role = (user as any).role;
        token.username = (user as any).email;
        token.fullName = (user as any).name;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).user = {
        id: token.uid, role: token.role, username: token.username, fullName: token.fullName,
      };
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function requireAdmin(session: any) {
  if (!session?.user) throw new Response("Unauthorized", { status: 401 });
  if (session.user.role !== "ADMINISTRATOR") throw new Response("Forbidden", { status: 403 });
}
