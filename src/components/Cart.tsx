import React, { useState } from 'react';
import { ShoppingCart, X, Trash2, Plus, Minus, Phone, User, MessageSquare } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { submitLead } from '../services/bitrixService';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

const Cart: React.FC<CartProps> = ({ isOpen, onClose }) => {
  const { items, removeFromCart, updateQuantity, clearCart, getTotalPrice } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    comment: ''
  });

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity < 0.1) {
      removeFromCart(id);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('Пожалуйста, заполните имя и телефон');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const cartData = items.map(item => ({
        name: item.item.name,
        size: item.item.size,
        quantity: item.quantityPieces,
        weight: item.quantityTons,
        price: item.totalWithDelivery,
        branch: item.item.branch,
        gost: item.item.gost
      }));

      const leadData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        formType: 'Заказ из корзины',
        comment: `${formData.comment}\n\nТовары в корзине:\n${cartData.map(item => 
          `${item.name} ${item.size} - ${item.quantity} шт. (${item.weight.toFixed(2)} т) - ${Math.round(item.price).toLocaleString()} ₸`
        ).join('\n')}\n\nОбщая стоимость: ${Math.round(getTotalPrice()).toLocaleString()} ₸`,
        productData: { cartItems: cartData },
        source: 'Корзина АТЛАНТ МЕТАЛЛ',
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };

      const result = await submitLead(leadData);
      
      if (result.success) {
        setSubmitStatus('success');
        clearCart();
        setTimeout(() => {
          onClose();
          setShowOrderForm(false);
          setFormData({ name: '', phone: '', comment: '' });
        }, 3000);
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Ошибка отправки заказа:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 sm:p-6 flex justify-between items-center">
          <div className="flex items-center">
            <ShoppingCart className="h-6 sm:h-8 w-6 sm:w-8 mr-3" />
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Корзина</h2>
              <p className="text-blue-100 text-sm sm:text-base">{items.length} товаров</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 max-h-[calc(95vh-200px)] overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <ShoppingCart className="h-16 sm:h-20 w-16 sm:w-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl sm:text-2xl font-bold text-gray-600 mb-2">Корзина пуста</h3>
              <p className="text-gray-500">Добавьте товары из калькулятора</p>
            </div>
          ) : showOrderForm ? (
            <div>
              <div className="mb-6">
                <button
                  onClick={() => setShowOrderForm(false)}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  ← Вернуться к корзине
                </button>
              </div>

              {submitStatus === 'success' ? (
                <div className="text-center py-8">
                  <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <Phone className="h-12 w-12 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Заказ отправлен! 🎉</h3>
                  <p className="text-gray-600 mb-6">
                    Наш менеджер свяжется с вами в течение <strong>15 минут</strong>
                  </p>
                </div>
              ) : submitStatus === 'error' ? (
                <div className="text-center py-8">
                  <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <X className="h-12 w-12 text-red-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Ошибка отправки</h3>
                  <p className="text-gray-600 mb-6">
                    Произошла ошибка при отправке заказа. Попробуйте еще раз или позвоните нам напрямую.
                  </p>
                  <button
                    onClick={() => setSubmitStatus('idle')}
                    className="bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Попробовать снова
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitOrder} className="space-y-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Оформление заказа</h3>
                  
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Ваше имя *</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 text-lg"
                        placeholder="Введите ваше имя"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Номер телефона *</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 text-lg"
                        placeholder="+7 (747) 219-93-69"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Комментарий</label>
                    <div className="relative">
                      <MessageSquare className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                      <textarea
                        value={formData.comment}
                        onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                        rows={3}
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 resize-none"
                        placeholder="Дополнительная информация..."
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-xl">
                    <h4 className="font-bold text-gray-900 mb-2">Итого к заказу:</h4>
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round(getTotalPrice()).toLocaleString()} ₸
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      * Актуальность цен уточняйте у менеджера
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-700 text-white py-4 rounded-xl font-bold text-xl transition-all disabled:cursor-not-allowed shadow-lg"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Отправляем...
                      </span>
                    ) : (
                      'Отправить заказ'
                    )}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div>
              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="bg-gray-50 p-4 rounded-xl">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-lg mb-1">
                          {item.item.name} {item.item.size}
                        </h4>
                        <p className="text-gray-600 text-sm mb-2">{item.item.gost}</p>
                        <p className="text-gray-600 text-sm">Филиал: {item.item.branch}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 p-2"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Тонн:</p>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantityTons - 0.1)}
                            className="w-8 h-8 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600"
                          >
                            <Minus className="h-4 w-4 mx-auto" />
                          </button>
                          <span className="font-bold text-center min-w-[60px]">
                            {item.quantityTons.toFixed(1)}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantityTons + 0.1)}
                            className="w-8 h-8 bg-green-500 text-white rounded-lg text-sm font-bold hover:bg-green-600"
                          >
                            <Plus className="h-4 w-4 mx-auto" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Штук:</p>
                        <p className="font-bold">{item.quantityPieces}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Метров:</p>
                        <p className="font-bold">{item.quantityMeters}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Стоимость:</p>
                        <p className="font-bold text-blue-600">
                          {Math.round(item.totalWithDelivery).toLocaleString()} ₸
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl mb-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-bold text-gray-900">Общая стоимость:</span>
                  <span className="text-3xl font-bold text-blue-600">
                    {Math.round(getTotalPrice()).toLocaleString()} ₸
                  </span>
                </div>
                <p className="text-sm text-gray-600 text-center">
                  * Актуальность цен уточняйте у менеджера
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setShowOrderForm(true)}
                  className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg"
                >
                  Оформить заказ
                </button>
                <button
                  onClick={clearCart}
                  className="bg-gray-500 hover:bg-gray-600 text-white py-4 px-6 rounded-xl font-bold transition-all"
                >
                  Очистить корзину
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cart;