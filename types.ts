
export interface Category {
  id: string;
  name: string;
  img: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  discount: number;
  img: string;
  category: string;
  offsetS?: number; // Custom offset for Small
  offsetL?: number; // Custom offset for Large
}

export interface Prize {
  id?: string;
  label: string;
  color: string;
  prob: number | string;
}

export interface CartItem {
  name: string;
  price: number;
  qty: number;
  size?: string | null;
  originalItem?: MenuItem;
  note?: string;
}

export interface Order {
  id?: string;
  orderID: number;
  items: string;
  total: string;
  location: string;
  note: string;
  time: string;
  status: 'pending' | 'completed';
}
