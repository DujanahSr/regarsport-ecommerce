/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import toast from "react-hot-toast";

import api from "../services/api";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

  const loadWishlist = useCallback(async () => {
    if (!user) {
      setWishlistItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const saved = localStorage.getItem("regar_wishlist");
      if (saved) {
        const items = JSON.parse(saved);
        let needsUpdate = false;

        // Auto-heal items that were saved with missing details or placeholder images
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const hasInvalidData =
            !item.products?.name ||
            item.products?.name === "Produk" ||
            !item.products?.price ||
            item.products?.image_url?.includes("placehold.co");

          if (hasInvalidData) {
            try {
              const res = await api.get(
                `/products/${item.product_id || item.products?.id}`
              );
              const p = res.data?.data || res.data;
              if (p && p.name) {
                item.products = {
                  id: p.id,
                  name: p.name,
                  price: Number(p.price) || 0,
                  image_url:
                    p.imageUrl ||
                    p.image_url ||
                    "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&q=80",
                };
                needsUpdate = true;
              }
            } catch {
              // ignore
            }
          }
        }

        if (needsUpdate) {
          localStorage.setItem("regar_wishlist", JSON.stringify(items));
        }
        setWishlistItems(items);
      } else {
        setWishlistItems([]);
      }
    } catch {
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addToWishlist = useCallback(
    async (productOrId) => {
      try {
        const prodId =
          typeof productOrId === "object" ? productOrId.id : productOrId;
        let prodObj =
          typeof productOrId === "object" && productOrId.name
            ? productOrId
            : null;

        if (!prodObj) {
          try {
            const res = await api.get(`/products/${prodId}`);
            prodObj = res.data?.data || res.data;
          } catch {
            prodObj = { id: prodId };
          }
        }

        const item = {
          id: Date.now(),
          product_id: prodId,
          products: {
            id: prodId,
            name: prodObj.name || "Produk",
            price: Number(prodObj.price) || 0,
            image_url:
              prodObj.imageUrl ||
              prodObj.image_url ||
              "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&q=80",
          },
        };

        const updated = [
          ...wishlistItems.filter(
            (w) => (w.product_id || w.products?.id) !== prodId
          ),
          item,
        ];
        setWishlistItems(updated);
        localStorage.setItem("regar_wishlist", JSON.stringify(updated));
        toast.success("Produk ditambahkan ke wishlist");
        return true;
      } catch {
        toast.error("Gagal menambahkan ke wishlist");
        return false;
      }
    },
    [wishlistItems]
  );

  const removeWishlist = useCallback(
    async (wishlistId) => {
      try {
        const updated = wishlistItems.filter(
          (item) => item.id !== wishlistId && item.product_id !== wishlistId
        );
        setWishlistItems(updated);
        localStorage.setItem("regar_wishlist", JSON.stringify(updated));
        toast.success("Wishlist dihapus");
      } catch {
        toast.error("Gagal menghapus wishlist");
      }
    },
    [wishlistItems]
  );

  const isWishlisted = useCallback(
    (productId) => {
      return wishlistItems.some(
        (item) =>
          item.product_id === productId || item.products?.id === productId
      );
    },
    [wishlistItems]
  );

  const getWishlistItemId = useCallback(
    (productId) => {
      const item = wishlistItems.find(
        (item) =>
          item.product_id === productId || item.products?.id === productId
      );

      return item?.id || item?.product_id;
    },
    [wishlistItems]
  );

  useEffect(() => {
    if (authLoading) {
      return;
    }

    loadWishlist();
  }, [authLoading, loadWishlist]);

  const value = useMemo(
    () => ({
      wishlistItems,
      loading,
      loadWishlist,
      addToWishlist,
      removeWishlist,
      isWishlisted,
      getWishlistItemId,
    }),
    [
      addToWishlist,
      getWishlistItemId,
      isWishlisted,
      loadWishlist,
      loading,
      removeWishlist,
      wishlistItems,
    ]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
