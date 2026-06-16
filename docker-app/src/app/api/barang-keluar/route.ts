import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  barangId: z.string().min(1),
  jumlah: z.coerce.number().int().min(1),
  tanggalKeluar: z.string().min(1),
  keterangan: z.string().optional().nullable(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  const data = await prisma.barangKeluar.findMany({ include: { barang: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  const body = schema.parse(await req.json());
  try {
    const result = await prisma.$transaction(async tx => {
      const b = await tx.barang.findUnique({ where: { id: body.barangId } });
      if (!b) throw new Error("Barang tidak ditemukan");
      if (b.stok < body.jumlah) throw new Error(`Stok tidak cukup. Tersedia: ${b.stok}`);
      const row = await tx.barangKeluar.create({ data: {
        barangId: body.barangId, jumlah: body.jumlah,
        tanggalKeluar: new Date(body.tanggalKeluar),
        keterangan: body.keterangan || null,
        createdById: (session.user as any).id,
      }});
      await tx.barang.update({ where: { id: body.barangId }, data: { stok: { decrement: body.jumlah } } });
      return row;
    });
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  const id = new URL(req.url).searchParams.get("id"); if (!id) return new NextResponse("id required", { status: 400 });
  await prisma.$transaction(async tx => {
    const row = await tx.barangKeluar.delete({ where: { id } });
    await tx.barang.update({ where: { id: row.barangId }, data: { stok: { increment: row.jumlah } } });
  });
  return NextResponse.json({ ok: true });
}
