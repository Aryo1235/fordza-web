export type ShiftStatus = 'OPEN' | 'CLOSED';

export interface CashierShift {
  id: string;
  adminId: string;
  startTime: string;
  endTime: string | null;
  startingCash: number;
  expectedEndingCash: number | null;
  actualEndingCash: number | null;
  cashSales?: number;
  debitSales?: number;
  qrisSales?: number;
  status: ShiftStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  admin?: {
    name: string | null;
    username: string;
  };
  _count?: {
    transactions: number;
  };
}

export interface OpenShiftPayload {
  startingCash: number;
  notes?: string;
}

export interface CloseShiftPayload {
  actualEndingCash: number;
}
