"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function DashboardChart({ data }: { data: { bulan: string; masuk: number; keluar: number }[] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="bulan" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="masuk" name="Barang Masuk" fill="#f59e0b" radius={[4,4,0,0]} />
          <Bar dataKey="keluar" name="Barang Keluar" fill="#3b82f6" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
