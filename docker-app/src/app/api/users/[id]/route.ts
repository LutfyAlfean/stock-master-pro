import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  fullName: z.string().min(1).max(100),
  role: z.enum(["ADMINISTRATOR", "STAFF"]),
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const s = await getServerSession(authOptions); await requireAdmin(s);
  const b = schema.parse(await req.json());
  await prisma.user.update({ where: { id: params.id }, data: { fullName: b.fullName, role: b.role as any } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const s = await getServerSession(authOptions); await requireAdmin(s);
  if ((s!.user as any).id === params.id) return NextResponse.json({ error: "Tidak bisa menghapus akun sendiri" }, { status: 400 });
  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
