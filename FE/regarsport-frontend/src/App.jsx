import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Suspense, lazy } from "react";
import { Toaster } from "react-hot-toast";

import ProtectedRoute from "./routes/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { ScreenLoader } from "./components/common/UiStates";
import About from "./pages/customer/About";

const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Categories = lazy(() => import("./pages/admin/Categories"));
const Products = lazy(() => import("./pages/admin/Products"));
const Orders = lazy(() => import("./pages/admin/Orders"));
const Users = lazy(() => import("./pages/admin/Users"));
const Reviews = lazy(() => import("./pages/admin/Reviews"));
const Home = lazy(() => import("./pages/customer/Home"));
const ProductDetail = lazy(() => import("./pages/customer/ProductDetail"));
const Cart = lazy(() => import("./pages/customer/Cart"));
const Checkout = lazy(() => import("./pages/customer/Checkout"));
const Profile = lazy(() => import("./pages/customer/Profile"));
const Favorites = lazy(() => import("./pages/customer/Favorites"));
const MyOrders = lazy(() => import("./pages/customer/MyOrders"));
const OrderDetail = lazy(() => import("./pages/customer/OrderDetail"));
const Landing = lazy(() => import("./pages/customer/Landing"));
const Inventory = lazy(() => import("./pages/admin/Inventory"));
const WarehouseDashboard = lazy(() => import("./pages/admin/WarehouseDashboard"));
const Vouchers = lazy(() => import("./pages/admin/Vouchers"));
const WarrantyClaims = lazy(() => import("./pages/admin/WarrantyClaims"));
const AdminLayouts = lazy(() => import("./layouts/AdminLayouts"));
const CustomerLayouts = lazy(() => import("./layouts/CustomerLayouts"));


export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: "12px",
            background: "#111827",
            color: "#fff",
          },
        }}
      />
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Suspense fallback={<ScreenLoader />}>
              <Routes>

                {/* Public Landing Page */}
                <Route
                  path="/"
                  element={<Landing />}
                />

                {/* Auth */}
                <Route
                  path="/login"
                  element={<Login />}
                />

                <Route
                  path="/register"
                  element={<Register />}
                />

                {/* CUSTOMER */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <CustomerLayouts />
                    </ProtectedRoute>
                  }
                >
                  <Route
                    index
                    element={<Home />}
                  />

                  <Route
                    path="product/:id"
                    element={<ProductDetail />}
                  />

                  <Route path="about" element={<About />} />

                  <Route
                    path="cart"
                    element={<Cart />}
                  />

                  <Route
                    path="favorites"
                    element={<Favorites />}
                  />

                  <Route
                    path="checkout"
                    element={<Checkout />}
                  />
                  <Route
                    path="my-orders"
                    element={<MyOrders />}
                  />
                  <Route
                    path="orders/:id"
                    element={<OrderDetail />}
                  />

                  <Route
                    path="profile"
                    element={<Profile />}
                  />
                </Route>

                {/* ADMIN & LOGISTICS */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "logistics"]}>
                      <AdminLayouts />
                    </ProtectedRoute>
                  }
                >
                  <Route
                    index
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="categories"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <Categories />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="products"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <Products />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="warehouse"
                    element={<WarehouseDashboard />}
                  />

                  <Route
                    path="inventory"
                    element={<Inventory />}
                  />

                  <Route
                    path="orders"
                    element={<Orders />}
                  />

                  <Route
                    path="warranty-claims"
                    element={<WarrantyClaims />}
                  />

                  <Route
                    path="vouchers"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <Vouchers />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="users"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <Users />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="reviews"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <Reviews />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="profile"
                    element={<Profile />}
                  />
                </Route>

              </Routes>
            </Suspense>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}