import api from "./api";
import type { ApiResponse, PageResponse, AuthResponse, User, Product, Category, CartItem, Order, PaymentTransaction } from "../types/api";

// Auth API
export const authApi = {
  register: (data: { fullName: string; email: string; password: string }) =>
    api.post<ApiResponse<AuthResponse>>("/auth/register", data).then((res) => res.data),
  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<AuthResponse>>("/auth/login", data).then((res) => res.data),
  me: () => api.get<ApiResponse<User>>("/auth/me").then((res) => res.data),
  updateProfile: (data: { fullName: string; avatarUrl?: string }) =>
    api.put<ApiResponse<User>>("/auth/profile", data).then((res) => res.data),
};

// Catalog API
export const catalogApi = {
  getCategories: () => api.get<ApiResponse<Category[]>>("/categories").then((res) => res.data),
  getProducts: (params?: { search?: string; categoryId?: number; page?: number; size?: number }) =>
    api.get<ApiResponse<PageResponse<Product>>>("/products", { params }).then((res) => res.data),
  getProductById: (id: number) => api.get<ApiResponse<Product>>(`/products/${id}`).then((res) => res.data),
};

// Cart & Orders API
export const orderApi = {
  getCart: () => api.get<ApiResponse<CartItem[]>>("/cart").then((res) => res.data),
  addToCart: (item: { productId: number; productName: string; productImage?: string; price: number; quantity: number }) =>
    api.post<ApiResponse<CartItem>>("/cart", item).then((res) => res.data),
  updateCartQty: (id: number, quantity: number) =>
    api.put<ApiResponse<CartItem>>(`/cart/${id}`, { quantity }).then((res) => res.data),
  removeCartItem: (id: number) => api.delete<ApiResponse<null>>(`/cart/${id}`).then((res) => res.data),
  clearCart: () => api.delete<ApiResponse<null>>("/cart").then((res) => res.data),

  checkout: (data: { shippingAddress: string; items: { productId: number; productName: string; productImage?: string; price: number; quantity: number }[] }) =>
    api.post<ApiResponse<Order>>("/orders/checkout", data).then((res) => res.data),
  getMyOrders: (page = 1, size = 10) =>
    api.get<ApiResponse<PageResponse<Order>>>("/orders/my-orders", { params: { page, size } }).then((res) => res.data),
  getOrderById: (id: number) => api.get<ApiResponse<Order>>(`/orders/${id}`).then((res) => res.data),
};

// Payment API
export const paymentApi = {
  createToken: (data: { orderId: number; orderNumber: string; customerEmail: string; customerName: string; amount: number }) =>
    api.post<ApiResponse<PaymentTransaction>>("/payments/create-token", data).then((res) => res.data),
  getPaymentByOrderId: (orderId: number) =>
    api.get<ApiResponse<PaymentTransaction>>(`/payments/order/${orderId}`).then((res) => res.data),
};
