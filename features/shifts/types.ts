export type ShiftStatus = 'OPEN' | 'CLOSED';

export interface CashierShift {
  id: string;
  adminId: string;
  startTime: string;
  endTime: string | null;
  startingCash: number | string;
  expectedEndingCash: number | string | null;
  actualEndingCash: number | string | null;
  status: ShiftStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OpenShiftPayload {
  startingCash: number;
  notes?: string;
}

export interface CloseShiftPayload {
  actualEndingCash: number;
}
