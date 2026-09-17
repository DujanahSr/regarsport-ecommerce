export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
}

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: 'ROLE_CUSTOMER' | 'ROLE_ADMIN';
  avatarUrl?: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface Category {
  id: number;
  name: string;
  imageUrl?: string;
  createdAt?: string;
}

export interface Product {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  id: number;
  userId: number;
  productId: number;
  productName: string;
  productImage?: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productImage?: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  shippingAddress: string;
  status: 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'CANCELLED';
  items: OrderItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface PaymentTransaction {
  id: number;
  orderId: number;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  amount: number;
  paymentStatus: 'PENDING' | 'SETTLEMENT' | 'PAID' | 'EXPIRE' | 'CANCEL' | 'DENY';
  paymentType?: string;
  snapToken?: string;
  snapRedirectUrl?: string;
  paidAt?: string;
  createdAt: string;
}
