import { Metadata } from "next";
import { ShiftsClient } from "./ShiftsClient";

export const metadata: Metadata = {
  title: "Laporan Laci Kasir | Fordza",
};

export default function ShiftsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ShiftsClient />
    </div>
  );
}
