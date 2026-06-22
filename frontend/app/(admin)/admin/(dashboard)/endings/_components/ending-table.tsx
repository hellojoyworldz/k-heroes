import {
  AdminDataTable,
  AdminTableCell,
  AdminTableRow,
  type AdminTableColumn,
} from "@/app/(admin)/_components/admin-data-table";
import type { EndingListItem } from "@/app/(admin)/admin/(dashboard)/endings/_types";
import { formatEndingTypeLabel } from "@/app/(admin)/admin/(dashboard)/endings/_constants";

const columns: AdminTableColumn[] = [
  { key: "id", header: "ID", className: "w-16" },
  { key: "character", header: "인물" },
  { key: "scenario", header: "시나리오", className: "w-36" },
  { key: "path_key", header: "경로", className: "w-28" },
  { key: "ending_type", header: "엔딩 유형", className: "w-36" },
  { key: "title", header: "제목" },
];

type EndingTableProps = {
  endings: EndingListItem[];
  emptyMessage: string;
  onRowClick?: (ending: EndingListItem) => void;
};

export function EndingTable({ endings, emptyMessage, onRowClick }: EndingTableProps) {
  return (
    <AdminDataTable columns={columns} emptyMessage={emptyMessage} isEmpty={endings.length === 0}>
      {endings.map((ending) => (
        <AdminTableRow key={ending.id} onClick={() => onRowClick?.(ending)}>
          <AdminTableCell className="text-[#8A847C]">{ending.id}</AdminTableCell>
          <AdminTableCell className="font-medium text-[#1A1714]">{ending.character.name}</AdminTableCell>
          <AdminTableCell>{ending.scenario.title}</AdminTableCell>
          <AdminTableCell className="font-mono text-sm text-[#3A3530]">{ending.path_key}</AdminTableCell>
          <AdminTableCell className="text-[#8A847C]">{formatEndingTypeLabel(ending.ending_type)}</AdminTableCell>
          <AdminTableCell>{ending.title}</AdminTableCell>
        </AdminTableRow>
      ))}
    </AdminDataTable>
  );
}
