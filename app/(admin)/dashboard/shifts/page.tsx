import { Metadata } from "next";
import { ShiftRepository } from "@/backend/repositories/shift.repo";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Laporan Laci Kasir | Fordza",
};

export default async function ShiftsPage() {
  const shifts = await ShiftRepository.getAllShifts();

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#3C3025]">
          Laporan Audit Laci Kasir
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Pantau seluruh aktivitas rekam jumlah kas uang masuk dan kejujuran kasir.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader className="bg-stone-50">
            <TableRow>
              <TableHead>Kasir</TableHead>
              <TableHead>Waktu (Buka - Tutup)</TableHead>
              <TableHead>Modal Awal</TableHead>
              <TableHead>Expected Laci (Sistem)</TableHead>
              <TableHead>Laporan Fisik (Hitung Tutup)</TableHead>
              <TableHead>Transaksi</TableHead>
              <TableHead>Status / Selisih</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shifts.map((shift: any) => {
              const disparity = Number(shift.actualEndingCash || 0) - Number(shift.expectedEndingCash || 0);
              const isClosed = shift.status === "CLOSED";

              return (
                <TableRow key={shift.id}>
                  <TableCell className="font-medium">
                    {shift.admin?.name || shift.adminId}<br />
                    <span className="text-xs text-muted-foreground">@{shift.admin?.username}</span>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="text-stone-800">
                      Buka: {format(new Date(shift.createdAt), "dd MMM HH:mm", { locale: id })}
                    </div>
                    <div className="text-muted-foreground">
                      Tutup: {shift.endTime ? format(new Date(shift.endTime), "dd MMM HH:mm", { locale: id }) : "-"}
                    </div>
                  </TableCell>
                  <TableCell>Rp {Number(shift.startingCash).toLocaleString('id-ID')}</TableCell>
                  <TableCell className="text-blue-600 font-semibold">
                    {shift.expectedEndingCash != null ? `Rp ${Number(shift.expectedEndingCash).toLocaleString('id-ID')}` : "-"}
                  </TableCell>
                  <TableCell className="text-stone-800 font-bold">
                    {shift.actualEndingCash != null ? `Rp ${Number(shift.actualEndingCash).toLocaleString('id-ID')}` : "-"}
                  </TableCell>
                  <TableCell>{shift._count?.transactions || 0} Trx</TableCell>
                  <TableCell>
                    {!isClosed ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        AKTIF (OPEN)
                      </Badge>
                    ) : (
                      disparity < 0 ? (
                        <div className="flex flex-col gap-1 items-start">
                          <Badge variant="destructive">MINUS</Badge>
                          <span className="text-xs text-red-600 font-bold">- Rp {Math.abs(disparity).toLocaleString('id-ID')}</span>
                        </div>
                      ) : disparity > 0 ? (
                        <div className="flex flex-col gap-1 items-start">
                          <Badge className="bg-orange-50 text-orange-700 border-orange-200 border">LEBIH</Badge>
                          <span className="text-xs text-orange-600 font-bold">+ Rp {Math.abs(disparity).toLocaleString('id-ID')}</span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="bg-stone-100 text-stone-700">BALANCE (PAS)</Badge>
                      )
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            
            {shifts.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  Belum ada data shift kasir
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
