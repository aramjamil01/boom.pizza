
export enum OrderStatus {
  PENDING = 'PENDING',
  COOKING = 'COOKING',
  READY = 'READY',
  PAID = 'PAID'
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
}

export interface OrderItem {
  menuItemId: string;
  quantity: number;
  priceAtOrder: number;
}

// Updated Order interface to match implementation and fix rendering errors
export interface Order {
  id: string;
  orderID?: number | string;
  tableNumber?: number;
  // Changed from OrderItem[] to string to support summarized display in UI
  items: string;
  status: OrderStatus;
  total: number | string;
  createdAt: Date;
  time?: string;
  note?: string;
}

export interface Table {
  id: number;
  status: 'available' | 'occupied' | 'reserved';
}

export type ViewState = 'dashboard' | 'menu' | 'pos' | 'kitchen' | 'ai-helper';
