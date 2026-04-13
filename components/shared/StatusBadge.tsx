import { Badge } from "@/components/ui/badge";

export function StatusBadge({ active, labelOn = "Aktif", labelOff = "Nonaktif" }: { active: boolean, labelOn?: string, labelOff?: string }) {
  if (active) {
    return <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-100">{labelOn}</Badge>;
  }
  return <Badge variant="secondary" className="bg-slate-100 text-slate-800 hover:bg-slate-100">{labelOff}</Badge>;
}
