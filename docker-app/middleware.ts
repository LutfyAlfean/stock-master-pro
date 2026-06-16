export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/barang/:path*",
    "/barang-masuk/:path*",
    "/barang-keluar/:path*",
    "/manajemen-pengguna/:path*",
  ],
};
