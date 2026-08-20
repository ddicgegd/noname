/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import SplashScreen from "./components/SplashScreen";
import Navbar from "./components/Navbar";
import SpotlightSection from "./components/SpotlightSection";
import FeatureOne from "./components/FeatureOne";
import ShowcaseSection from "./components/ShowcaseSection";
import PricingSection from "./components/PricingSection";
import ProductPage from "./components/ProductPage";
import RegisterPage from "./components/RegisterPage";
import AuthReportDashboard from "./components/AuthReportDashboard";
import ProfilePage from "./components/ProfilePage";
import TermsPage from "./components/TermsPage";
import OrderPage from "./components/OrderPage";
import { AnimatePresence, motion } from "motion/react";

interface CartItem {
  id: string;
  name: string;
  price: string;
  icon: string;
}

interface FlyingItem {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  icon: string;
  color?: string;
  shadowColor?: string;
}

interface RisingStar {
  id: string;
  x: number;
  y: number;
  driftX: number;
  driftY: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
}

export default function App() {
  const getPageFromPath = (path: string): "landing" | "product" | "order" | "auth" | "auth-report" | "profile" | "terms" => {
    const cleanPath = path.toLowerCase().replace(/\/$/, "");
    if (["/p", "/product"].includes(cleanPath)) return "product";
    if (["/o", "/order", "/orders", "/checkout", "/shipping", "/cart"].includes(cleanPath)) return "order";
    if (["/auth-report", "/diagnostic"].includes(cleanPath)) return "auth-report";
    if (["/profile", "/account", "/accounts"].includes(cleanPath)) return "profile";
    if (["/verify-email", "/verify"].includes(cleanPath)) {
      window.history.replaceState({}, "", "/auth#login" + window.location.search);
      return "auth";
    }
    if (cleanPath === "/auth") return "auth";
    if (["/terms", "/privacy"].includes(cleanPath)) return "terms";
    return "landing";
  };

  const getPathFromPage = (page: string) => {
    switch (page) {
      case "landing": return "/";
      case "product": return "/p";
      case "order": return "/o";
      case "auth-report": return "/auth-report";
      case "profile": return "/profile";
      case "auth": {
        const hash = window.location.hash.toLowerCase();
        if (hash === "#register") return "/auth#register";
        if (hash === "#verify") return "/auth#verify";
        return "/auth#login";
      }
      case "terms": return "/terms";
      default: return "/";
    }
  };

  const [currentPage, setCurrentPage] = useState<"landing" | "product" | "order" | "auth" | "auth-report" | "profile" | "terms">((() => {
    const page = getPageFromPath(window.location.pathname);
    if (page === "auth") {
      const hash = window.location.hash.toLowerCase();
      if (!["#login", "#register", "#verify"].includes(hash)) {
        window.history.replaceState({}, "", "/auth#login");
      }
    }
    return page;
  }));

  const [activeBrand, setActiveBrand] = useState("Samsung");
  const [buyNowProduct, setBuyNowProduct] = useState<any>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { id: "1", name: "Professional Plan", price: "$49 / tháng", icon: "📦" },
    { id: "2", name: "Premium Add-on", price: "$19 / tháng", icon: "⚡" }
  ]);
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const [risingStars, setRisingStars] = useState<RisingStar[]>([]);

  // Automatically scroll to the top on page transition
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [currentPage]);

  // Sync with browser back/forward buttons & hash changes
  useEffect(() => {
    const handlePopState = () => {
      const page = getPageFromPath(window.location.pathname);
      setCurrentPage(page);
      if (page === "auth") {
        const hash = window.location.hash.toLowerCase();
        if (!["#login", "#register", "#verify"].includes(hash)) {
          window.history.replaceState({}, "", "/auth#login");
        }
      }
    };
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("hashchange", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("hashchange", handlePopState);
    };
  }, []);

  // Custom navigate function to sync with address bar
  const navigate = (page: "landing" | "product" | "order" | "auth" | "auth-report" | "profile" | "terms") => {
    setCurrentPage(page);
    let targetPath = getPathFromPage(page);
    if (page === "auth") {
      const hash = window.location.hash.toLowerCase();
      if (hash === "#register") {
        targetPath = "/auth#register";
      } else if (hash === "#verify") {
        targetPath = "/auth#verify";
      } else {
        targetPath = "/auth#login";
      }
    }
    if (window.location.pathname + window.location.hash !== targetPath) {
      window.history.pushState({}, "", targetPath);
    }
  };

  const handleSpawnStars = (x: number, y: number, color: string) => {
    const newStars: RisingStar[] = Array.from({ length: 15 }).map((_, i) => {
      const angle = (i / 15) * 2 * Math.PI + (Math.random() - 0.5) * 0.5;
      const speed = 60 + Math.random() * 90;
      return {
        id: `star-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 9)}`,
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 10,
        driftX: Math.cos(angle) * speed * 0.8,
        driftY: -150 - Math.random() * 120 + Math.sin(angle) * speed * 0.4,
        size: 8 + Math.random() * 18,
        color,
        delay: Math.random() * 0.2,
        duration: 1.0 + Math.random() * 0.8,
      };
    });
    setRisingStars(prev => [...prev, ...newStars]);
  };

  const handleFlyEffect = (
    startX: number,
    startY: number,
    icon: string,
    color?: string,
    shadowColor?: string
  ) => {
    let endX = window.innerWidth * 0.78;
    let endY = 40;
    const cartIconEl = document.querySelector(".lucide-shopping-cart");
    if (cartIconEl) {
      const rect = cartIconEl.getBoundingClientRect();
      endX = rect.left + rect.width / 2;
      endY = rect.top + rect.height / 2;
    }

    setFlyingItems(prev => [
      ...prev,
      {
        id: `fly-effect-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        startX,
        startY,
        endX,
        endY,
        icon,
        color,
        shadowColor
      }
    ]);
  };

  const handleFlyToAccount = (
    startX: number,
    startY: number,
    icon: string = "🎟️",
    color: string = "#FF4D24",
    shadowColor: string = "rgba(255,77,36,0.4)"
  ) => {
    let endX = window.innerWidth * 0.88;
    let endY = 40;
    const accountButton = document.getElementById("navbar-account-button");
    if (accountButton) {
      const rect = accountButton.getBoundingClientRect();
      endX = rect.left + rect.width / 2;
      endY = rect.top + rect.height / 2;
    }

    setFlyingItems(prev => [
      ...prev,
      {
        id: `fly-acct-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        startX,
        startY,
        endX,
        endY,
        icon,
        color,
        shadowColor
      }
    ]);
  };

  const handleAddToCart = (
    name: string,
    price: string,
    clickEvent?: React.MouseEvent | { clientX: number; clientY: number }
  ) => {
    // Generate simple appropriate emoji based on product name
    let icon = "📦";
    if (name.toLowerCase().includes("ai") || name.toLowerCase().includes("trí tuệ")) icon = "🧠";
    else if (name.toLowerCase().includes("compute") || name.toLowerCase().includes("vinh")) icon = "⚡";
    else if (name.toLowerCase().includes("storage") || name.toLowerCase().includes("lưu trữ")) icon = "💾";
    else if (name.toLowerCase().includes("network") || name.toLowerCase().includes("mạng")) icon = "🌐";
    else if (name.toLowerCase().includes("watch") || name.toLowerCase().includes("đồng hồ")) icon = "⌚";

    const newItem: CartItem = {
      id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name,
      price,
      icon
    };
    setCartItems(prev => [...prev, newItem]);

    // Flying animation coordinates
    let startX = window.innerWidth / 2;
    let startY = window.innerHeight / 2;
    if (clickEvent && "clientX" in clickEvent) {
      startX = clickEvent.clientX;
      startY = clickEvent.clientY;
    }

    let endX = window.innerWidth * 0.78;
    let endY = 40;
    const cartIconEl = document.querySelector(".lucide-shopping-cart");
    if (cartIconEl) {
      const rect = cartIconEl.getBoundingClientRect();
      endX = rect.left + rect.width / 2;
      endY = rect.top + rect.height / 2;
    }

    setFlyingItems(prev => [
      ...prev,
      {
        id: `fly-cart-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        startX,
        startY,
        endX,
        endY,
        icon
      }
    ]);
  };

  const handleRemoveCartItem = (id: string | string[]) => {
    if (Array.isArray(id)) {
      setCartItems(prev => prev.filter(item => !id.includes(item.id)));
    } else {
      setCartItems(prev => prev.filter(item => item.id !== id));
    }
  };

  return (
    <div className="relative w-full min-h-screen overflow-x-clip bg-[#E4E4E4] text-[#111111]">
      {/* 1. Splash Screen Transition Curtain */}
      <SplashScreen />

      {/* 2. Synchronized Top Floating Glassmorphism Navbar */}
      {currentPage !== "auth" && currentPage !== "auth-report" && currentPage !== "terms" && (
        <Navbar 
          currentPage={currentPage}
          onNavigate={navigate}
          cartItems={cartItems}
          onRemoveCartItem={handleRemoveCartItem}
          onAddToCart={(name, price) => handleAddToCart(name, price)}
        />
      )}

      {/* Conditionally Render Landing Page Sections, Product Page, Register Page or Auth Report with Motion transitions */}
      <AnimatePresence mode="wait">
        {currentPage === "landing" ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            {/* 3. Immersive Spotlight Hero Area (Original Spotlight Effect) */}
            <SpotlightSection bgText={activeBrand} onBgTextChange={setActiveBrand} />

            {/* 5. Scrollable SaaS Landing Sections */}
            <FeatureOne />
            
            <ShowcaseSection />
            
            <PricingSection />
          </motion.div>
        ) : currentPage === "product" ? (
          <motion.div
            key="product"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            <ProductPage 
              onAddToCart={handleAddToCart} 
              onNavigate={navigate} 
              onFlyEffect={handleFlyEffect}
              onSpawnStars={handleSpawnStars}
              onFlyToAccount={handleFlyToAccount}
              onBuyNow={(product) => {
                setBuyNowProduct(product);
                navigate("order");
              }}
            />
          </motion.div>
        ) : currentPage === "order" ? (
          <motion.div
            key="order"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            <OrderPage
              onNavigate={navigate}
              cartItems={cartItems}
              onRemoveCartItem={handleRemoveCartItem}
              onAddToCart={handleAddToCart}
              buyNowProduct={buyNowProduct}
            />
          </motion.div>
        ) : currentPage === "auth-report" ? (
          <motion.div
            key="auth-report"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            <AuthReportDashboard onNavigate={navigate} />
          </motion.div>
        ) : currentPage === "profile" ? (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            <ProfilePage onNavigate={navigate} />
          </motion.div>
        ) : currentPage === "auth" ? (
          <motion.div
            key="auth"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            <RegisterPage onNavigate={navigate} />
          </motion.div>
        ) : (
          <motion.div
            key="terms"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            <TermsPage onNavigate={navigate} />
          </motion.div>
        )}
      </AnimatePresence>


      {/* Floating Flying Elements Animation */}
      <AnimatePresence>
        {flyingItems.map((item) => (
          <motion.div
            key={item.id}
            initial={{ 
              position: "fixed",
              left: item.startX - 16,
              top: item.startY - 16,
              scale: 1,
              opacity: 1,
              zIndex: 9999,
              pointerEvents: "none"
            }}
            animate={{ 
              left: item.endX - 12,
              top: [item.startY - 16, item.startY - 120, item.endY - 12],
              scale: [1, 1.4, 0.35],
              opacity: [1, 1, 0.9, 0]
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.9, 
              ease: [0.25, 1, 0.5, 1] 
            }}
            onAnimationComplete={() => {
              setFlyingItems(prev => prev.filter(f => f.id !== item.id));
            }}
            style={{
              backgroundColor: item.color || "#FF4D24",
              boxShadow: `0 4px 12px ${item.shadowColor || "rgba(255,77,36,0.4)"}`
            }}
            className="w-8 h-8 rounded-full text-white flex items-center justify-center text-sm font-black border border-white"
          >
            {item.icon}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Floating Sparkles (Rising Stars) Animation Overlay */}
      <AnimatePresence>
        {risingStars.map((star) => (
          <motion.div
            key={star.id}
            initial={{
              position: "fixed",
              left: star.x,
              top: star.y,
              scale: 0.2,
              opacity: 0,
              rotate: 0,
              zIndex: 9999,
              pointerEvents: "none"
            }}
            animate={{
              left: star.x + star.driftX,
              top: star.y + star.driftY,
              scale: [0.2, 1.5, 0.8, 0],
              opacity: [0, 1, 1, 0],
              rotate: 180 + Math.random() * 360,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: star.duration,
              delay: star.delay,
              ease: "easeOut",
            }}
            onAnimationComplete={() => {
              setRisingStars(prev => prev.filter(s => s.id !== star.id));
            }}
            style={{
              width: `${star.size}px`,
              height: `${star.size}px`,
              color: star.color,
              filter: `drop-shadow(0 2px 4px ${star.color}66)`,
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
              <path d="M12 0 Q12 12 0 12 Q12 12 12 24 Q12 12 24 12 Q12 12 12 0 Z" />
            </svg>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
