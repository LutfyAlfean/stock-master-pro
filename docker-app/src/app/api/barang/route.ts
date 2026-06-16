import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  kode: z.string().min(1).max(50),
  nama: z.string().min(1).max(200),
  kategori: z.string().min(1).max(100),
  satuan: z.string().min(1).max(50),
  minimalStok: z.coerce.number().int().min(0).default(0),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  const data = await prisma.barang.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  const body = schema.parse(await req.json());
  const created = await prisma.barang.create({ data: body });
  return NextResponse.json(created);
}
