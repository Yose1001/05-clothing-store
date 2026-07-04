import { createContext, useContext, useEffect, useState } from 'react';

// ตะกร้าสินค้าเป็น state ที่ใช้ร่วมกันทุกหน้า จึงเก็บใน Context
// และ sync ลง localStorage เพื่อให้ตะกร้าไม่หายตอน refresh
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cart')) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  // สินค้าเดียวกันคนละไซซ์ = คนละรายการในตะกร้า
  const keyOf = (item) => `${item.productId}-${item.size}`;

  const addItem = (product, size, quantity) => {
    setItems((prev) => {
      const newItem = {
        productId: product._id,
        name: product.name,
        price: product.price,
        category: product.category,
        size,
        quantity,
      };
      const existing = prev.find((i) => keyOf(i) === keyOf(newItem));
      if (existing) {
        return prev.map((i) =>
          keyOf(i) === keyOf(newItem)
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, newItem];
    });
  };

  const updateQuantity = (productId, size, quantity) => {
    setItems((prev) =>
      quantity < 1
        ? prev.filter((i) => !(i.productId === productId && i.size === size))
        : prev.map((i) =>
            i.productId === productId && i.size === size
              ? { ...i, quantity }
              : i
          )
    );
  };

  const removeItem = (productId, size) => {
    setItems((prev) =>
      prev.filter((i) => !(i.productId === productId && i.size === size))
    );
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQuantity, removeItem, clearCart, total, count }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
