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

                {/* Redirect */}
                <Route
                  path="/"
                  element={<Navigate to="/login" />}
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

                {/* ADMIN */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute adminOnly>
                      <AdminLayouts />
                    </ProtectedRoute>
                  }
                >
                  <Route
                    index
                    element={<Dashboard />}
                  />

                  <Route
                    path="categories"
                    element={<Categories />}
                  />

                  <Route
                    path="products"
                    element={<Products />}
                  />

                  <Route
                    path="orders"
                    element={<Orders />}
                  />

                  <Route
                    path="users"
                    element={<Users />}
                  />
                  <Route
                    path="reviews"
                    element={<Reviews />}
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