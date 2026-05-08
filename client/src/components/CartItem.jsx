import { FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import './CartItem.css';

const CartItem = ({ item }) => {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className="cart-item glass-card" id={`cart-item-${item.id}`}>
      <div className="cart-item-image">
        <img 
          src={item.image_url} 
          alt={item.name}
          onError={(e) => {
            e.target.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="%231a2332"><rect width="100" height="100"/><text x="50" y="50" text-anchor="middle" fill="%234a5568" font-size="10" font-family="sans-serif">No Image</text></svg>');
          }}
        />
      </div>

      <div className="cart-item-details">
        <h4 className="cart-item-name">{item.name}</h4>
        <p className="cart-item-price">₹{parseFloat(item.price).toLocaleString('en-IN')}</p>
      </div>

      <div className="cart-item-controls">
        <div className="quantity-control">
          <button
            className="qty-btn"
            onClick={() => {
              if (item.quantity > 1) updateQuantity(item.id, item.quantity - 1);
            }}
            disabled={item.quantity <= 1}
            id={`qty-minus-${item.id}`}
          >
            <FiMinus size={14} />
          </button>
          <span className="qty-value">{item.quantity}</span>
          <button
            className="qty-btn"
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            id={`qty-plus-${item.id}`}
          >
            <FiPlus size={14} />
          </button>
        </div>

        <p className="cart-item-subtotal">
          ₹{(parseFloat(item.price) * item.quantity).toLocaleString('en-IN')}
        </p>
      </div>

      <button
        className="cart-item-remove"
        onClick={() => removeItem(item.id)}
        id={`remove-item-${item.id}`}
        aria-label="Remove item"
      >
        <FiTrash2 size={16} />
      </button>
    </div>
  );
};

export default CartItem;
