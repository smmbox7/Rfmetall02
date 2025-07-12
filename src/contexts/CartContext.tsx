import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PriceItem } from '../data/priceData';

export interface CartItem {
  id: string;
  item: PriceItem;
  quantityTons: number;
  quantityPieces: number;
  quantityMeters: number;
  pricePerTonTenge: number;
  pricePerTonRub: number;
  totalPriceTenge: number;
  totalPriceRub: number;
  deliveryPrice: number;
  totalWithDelivery: number;
  priceCategory: string;
  addedAt: Date;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (cartItem: Omit<CartItem, 'id' | 'addedAt'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantityTons: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getItemCount: (itemId: number) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // Загружаем корзину из localStorage при инициализации
  useEffect(() => {
    const savedCart = localStorage.getItem('atlantmetal_cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setItems(parsedCart.map((item: any) => ({
          ...item,
          addedAt: new Date(item.addedAt)
        })));
      } catch (error) {
        console.error('Ошибка загрузки корзины:', error);
      }
    }
  }, []);

  // Сохраняем корзину в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('atlantmetal_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (cartItem: Omit<CartItem, 'id' | 'addedAt'>) => {
    const id = `${cartItem.item.id}_${Date.now()}_${Math.random()}`;
    const newItem: CartItem = {
      ...cartItem,
      id,
      addedAt: new Date()
    };
    
    setItems(prev => [...prev, newItem]);
  };

  const removeFromCart = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantityTons: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const newPieces = Math.round((quantityTons * 1000) / item.item.weightPerPiece);
        const newMeters = newPieces * item.item.lengthValue;
        const newTotalTenge = item.pricePerTonTenge * quantityTons;
        const newTotalRub = item.pricePerTonRub * quantityTons;
        
        return {
          ...item,
          quantityTons,
          quantityPieces: newPieces,
          quantityMeters: newMeters,
          totalPriceTenge: newTotalTenge,
          totalPriceRub: newTotalRub,
          totalWithDelivery: newTotalTenge + item.deliveryPrice
        };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalItems = () => {
    return items.length;
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.totalWithDelivery, 0);
  };

  const getItemCount = (itemId: number) => {
    return items.filter(item => item.item.id === itemId).length;
  };

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalItems,
      getTotalPrice,
      getItemCount
    }}>
      {children}
    </CartContext.Provider>
  );
};