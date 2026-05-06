import { create } from "zustand";
import { persist } from "zustand/middleware";
import { OrderItem } from "@workspace/api-client-react";

interface CartItem extends Omit<OrderItem, "orderDetailId" | "subtotal"> {
  stockQuantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find((i) => i.productId === item.productId);
          if (existingItem) {
            const newQuantity = Math.min(existingItem.quantity + quantity, item.stockQuantity);
            return {
              items: state.items.map((i) =>
                i.productId === item.productId ? { ...i, quantity: newQuantity } : i
              ),
            };
          }
          return {
            items: [...state.items, { ...item, quantity: Math.min(quantity, item.stockQuantity) }],
          };
        });
      },
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },
      updateQuantity: (productId, quantity) => {
        set((state) => ({
          items: state.items.map((i) => {
            if (i.productId === productId) {
              return { ...i, quantity: Math.min(Math.max(1, quantity), i.stockQuantity) };
            }
            return i;
          }),
        }));
      },
      clearCart: () => set({ items: [] }),
      getCartTotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
      getCartCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: "ecommerce-cart",
    }
  )
);
