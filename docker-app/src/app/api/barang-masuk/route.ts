import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  barangId: z.string().min(1),
  jumlah: z.coerce.number().int().min(1),
  tanggalMasuk: z.string().min(1),
  tanggalKadaluarsa: z.string().optional().nullable(),
  keterangan: z.string().optional().nullable(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  const data = await prisma.barangMasuk.findMany({ include: { barang: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  const body = schema.parse(await req.json());
  const result = await prisma.$transaction(async tx => {
    const row = await tx.barangMasuk.create({ data: {
      barangId: body.barangId,
      jumlah: body.jumlah,
      tanggalMasuk: new Date(body.tanggalMasuk),
      tanggalKadaluarsa: body.tanggalKadaluarsa ? new Date(body.tanggalKadaluarsa) : null,
      keterangan: body.keterangan || null,
      createdById: (session.user as any).id,
    }});
    await tx.barang.update({ where: { id: body.barangId }, data: { stok: { increment: body.jumlah } } });
    return row;
  });
  return NextResponse.json(result);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  const id = new URL(req.url).searchParams.get("id"); if (!id) return new NextResponse("id required", { status: 400 });
  await prisma.$transaction(async tx => {
    const row = await tx.barangMasuk.delete({ where: { id } });
    await tx.barang.update({ where: { id: row.barangId }, data: { stok: { decrement: row.jumlah } } });
  });
  return NextResponse.json({ ok: true });
}
