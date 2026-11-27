import React, { useState } from 'react';
import { Home, ShoppingCart, MessageCircle, UserRound } from 'lucide-react';

interface Props {
  onHome: () => void;
  onOpenCart: () => void;
  onOpenAccount: () => void;
}

type NavKey = 'home' | 'cart' | 'chat' | 'account';

const gifBase = import.meta.env.BASE_URL + 'gifs/';

const GifImage: React.FC<{ name: string; alt: string }> = ({ name, alt }) => (
  <img
    className="gif-bg"
    src={gifBase + name}
    alt={alt}
    aria-hidden="true"
    onError={(event) => {
      // Keep the gradient/icon treatment visible until the matching GIF is added.
      event.currentTarget.style.display = 'none';
    }}
  />
);

export const MobileBottomNav: React.FC<Props> = ({ onHome, onOpenCart, onOpenAccount }) => {
  const [activeItem, setActiveItem] = useState<NavKey>('home');

  const select = (key: NavKey, action: () => void) => {
    setActiveItem(key);
    action();
  };

  return (
    <nav className="nav-dock md:hidden" aria-label="Main mobile navigation">
      <button
        type="button"
        onClick={() => select('home', onHome)}
        className={`nav-item nav-home ${activeItem === 'home' ? 'active' : ''}`}
        aria-current={activeItem === 'home' ? 'page' : undefined}
      >
        <span className="nav-gif-box">
          <GifImage name="home.gif" alt="" />
          <Home aria-hidden="true" />
        </span>
        <span>Home</span>
      </button>

      <button
        type="button"
        onClick={() => select('cart', onOpenCart)}
        className={`nav-item nav-cart ${activeItem === 'cart' ? 'active' : ''}`}
        aria-current={activeItem === 'cart' ? 'page' : undefined}
      >
        <span className="nav-gif-box">
          <GifImage name="cart.gif" alt="" />
          <ShoppingCart aria-hidden="true" />
        </span>
        <span>Cart</span>
      </button>

      <a
        href="https://wa.me/2349060938835"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => setActiveItem('chat')}
        className={`nav-item nav-chat ${activeItem === 'chat' ? 'active' : ''}`}
        aria-current={activeItem === 'chat' ? 'page' : undefined}
      >
        <span className="nav-gif-box">
          <GifImage name="chat.gif" alt="" />
          <MessageCircle aria-hidden="true" />
        </span>
        <span>Chat</span>
      </a>

      <button
        type="button"
        onClick={() => select('account', onOpenAccount)}
        className={`nav-item nav-account ${activeItem === 'account' ? 'active' : ''}`}
        aria-current={activeItem === 'account' ? 'page' : undefined}
      >
        <span className="nav-gif-box">
          <GifImage name="account.gif" alt="" />
          <UserRound aria-hidden="true" />
        </span>
        <span>Account</span>
      </button>
    </nav>
  );
};
