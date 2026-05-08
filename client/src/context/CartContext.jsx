import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCart as fetchCart, addToCart as apiAddToCart, updateCartItem as apiUpdateCartItem, removeCartItem as apiRemoveCartItem } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const loadCart = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await fetchCart();
      setItems(data.items);
    } catch (err) {
      console.error('Failed to load cart:', err);
    }
    setLoading(false);
  }, [isAuthenticated]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const addToCart = async (productId, quantity = 1) => {
    try {
      await apiAddToCart(productId, quantity);
      await loadCart();
      return true;
    } catch (err) {
      console.error('Add to cart failed:', err);
      return false;
    }
  };

  const updateQuantity = async (cartItemId, quantity) => {
    try {
      await apiUpdateCartItem(cartItemId, quantity);
      await loadCart();
    } catch (err) {
      console.error('Update cart failed:', err);
    }
  };

  const removeItem = async (cartItemId) => {
    try {
      await apiRemoveCartItem(cartItemId);
      await loadCart();
    } catch (err) {
      console.error('Remove from cart failed:', err);
    }
  };

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      loading,
      cartCount,
      cartTotal,
      addToCart,
      updateQuantity,
      removeItem,
      refreshCart: loadCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};
