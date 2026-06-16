import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username = "admin_pemilik";
  const exists = await prisma.user.findUnique({ where: { username } });
  if (!exists) {
    await prisma.user.create({
      data: {
        username,
        fullName: "Admin Pemilik",
        passwordHash: await bcrypt.hash("Admin_pemilik", 10),
        role: Role.ADMINISTRATOR,
      },
    });
    console.log("Seeded admin:", username, "/ Admin_pemilik");
  }

  const items = [
    { kode: "BZ005", nama: "Botol Zam-Zam", kategori: "Aksesoris dan Kosmetik", satuan: "Pcs", stok: 73, minimalStok: 20 },
    { kode: "CM002", nama: "Celak Mata", kategori: "Aksesoris dan Kosmetik", satuan: "Pcs", stok: 30, minimalStok: 10 },
    { kode: "HNT01", nama: "Henna Tangan", kategori: "Aksesoris dan Kosmetik", satuan: "Pcs", stok: 0, minimalStok: 5 },
    { kode: "KA001", nama: "Kurma Ajwa", kategori: "Makanan", satuan: "Kg", stok: 75, minimalStok: 20 },
    { kode: "KT001", nama: "Kurma Tunisia", kategori: "Makanan", satuan: "Kg", stok: 60, minimalStok: 20 },
    { kode: "ZZ001", nama: "Zam Zam", kategori: "Minuman", satuan: "Botol", stok: 100, minimalStok: 30 },
  ];
  for (const it of items) {
    await prisma.barang.upsert({ where: { kode: it.kode }, update: {}, create: it });
  }
  console.log("Seed selesai.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
