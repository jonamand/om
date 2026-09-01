import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import ShopPage from "./pages/ShopPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import EventsPage from "./pages/EventsPage";
import EventDetailPage from "./pages/EventDetailPage";
import CommunityPage from "./pages/CommunityPage";
import NewsDetailPage from "./pages/NewsDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import PaymentReturnPage from "./pages/PaymentReturnPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/boutique" element={<ShopPage />} />
        <Route path="/boutique/:slug" element={<ProductDetailPage />} />
        <Route path="/evenements" element={<EventsPage />} />
        <Route path="/evenements/:slug" element={<EventDetailPage />} />
        <Route path="/communaute" element={<CommunityPage />} />
        <Route path="/communaute/:slug" element={<NewsDetailPage />} />
        <Route path="/panier" element={<CartPage />} />
        <Route path="/connexion" element={<SignInPage />} />
        <Route path="/inscription" element={<SignUpPage />} />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute userOnly>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route path="/paiement/retour" element={<PaymentReturnPage />} />
        <Route
          path="/mon-espace"
          element={
            <ProtectedRoute userOnly>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profil"
          element={
            <ProtectedRoute userOnly>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
