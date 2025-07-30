export interface User {
  id: string;
  name: string;
  role: 'admin' | 'user';
  outstandingBalance: number;
}

export interface Purchase {
  id: string;
  purchaseDate: string;
  quantity: number;
  totalPrice: number;
  costPerPlayer: number;
  splitAmong: string[];
}

export interface UsageLog {
  id: string;
  usageDate: string;
  quantityUsed: number;
}

export interface InventoryState {
  totalShuttles: number;
  purchases: Purchase[];
  usageLogs: UsageLog[];
}
