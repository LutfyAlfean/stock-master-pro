import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const s = await getServerSession(authOptions); await requireAdmin(s);
  const { password } = z.object({ password: z.string().min(6).max(72) }).parse(await req.json());
  await prisma.user.update({ where: { id: params.id }, data: { passwordHash: await bcrypt.hash(password, 10) } });
  return NextResponse.json({ ok: true });
}
