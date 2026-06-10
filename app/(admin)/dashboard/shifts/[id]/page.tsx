import { Metadata } from "next";
import { ShiftDetailClient } from "./ShiftDetailClient";

export const metadata: Metadata = {
  title: "Detail Laci Kasir | Fordza",
};

interface ShiftDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ShiftDetailPage({ params }: ShiftDetailPageProps) {
  const { id } = await params;
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ShiftDetailClient id={id} />
    </div>
  );
}
