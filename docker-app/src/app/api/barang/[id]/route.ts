import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  kode: z.string().min(1),
  nama: z.string().min(1),
  kategori: z.string().min(1),
  satuan: z.string().min(1),
  minimalStok: z.coerce.number().int().min(0),
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  const body = schema.parse(await req.json());
  const updated = await prisma.barang.update({ where: { id: params.id }, data: body });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  await prisma.barang.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
