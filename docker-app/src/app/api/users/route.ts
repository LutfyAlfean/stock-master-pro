import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  fullName: z.string().min(1).max(100),
  password: z.string().min(6).max(72),
  role: z.enum(["ADMINISTRATOR", "STAFF"]),
});

export async function GET() {
  const s = await getServerSession(authOptions); await requireAdmin(s);
  const u = await prisma.user.findMany({ select: { id: true, username: true, fullName: true, role: true, createdAt: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(u);
}

export async function POST(req: Request) {
  const s = await getServerSession(authOptions); await requireAdmin(s);
  const b = schema.parse(await req.json());
  try {
    const u = await prisma.user.create({ data: {
      username: b.username.toLowerCase(),
      fullName: b.fullName,
      passwordHash: await bcrypt.hash(b.password, 10),
      role: b.role as any,
    }});
    return NextResponse.json({ id: u.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.code === "P2002" ? "Username sudah dipakai" : e.message }, { status: 400 });
  }
}
