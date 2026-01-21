import { useEffect, useState } from "react";
import { X, Gift, User, Search, Settings, Users, ExternalLink, Grid3x3, Brain } from "lucide-react";

export default function UserProfileModal({ isOpen, onClose, userName = "kiem", accountType = "Guest Account", onOpenFocusMode }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Small delay to trigger animation
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (e) => {
      if (isOpen && !e.target.closest('.user-profile-modal')) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const menuItems = [
    { icon: Gift, label: "Upgrade to Plus", hasChevron: true },
    { icon: User, label: "Public profile", hasChevron: true },
    { icon: Brain, label: "Focus mode", hasChevron: false },
    { icon: Search, label: "Find study room", hasChevron: true },
    { icon: Settings, label: "App settings", hasChevron: true },
    { icon: Users, label: "Manage friends", hasChevron: true },
    { icon: null, label: "Discord", hasExternalLink: true, customIcon: "discord" },
    { icon: null, label: "Chrome extension", hasExternalLink: true, customIcon: "puzzle" },
    { icon: Grid3x3, label: "Our apps", hasChevron: true },
  ];

  const handleItemClick = (label) => {
    console.log(`Clicked: ${label}`);
    if (label === 'Focus mode' && onOpenFocusMode) { onClose(); onOpenFocusMode(); }
  };

  return (
    <div 
      className={`
        absolute top-full right-0 mt-2 w-[340px] max-h-[70vh]
        bg-black/30 backdrop-blur-2xl
        rounded-xl shadow-2xl z-50
        overflow-hidden border border-white/20
        user-profile-modal
        transform transition-all duration-200 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}
      `}>
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{userName}</h2>
            <p className="text-sm text-gray-400">{accountType}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors p-1"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="py-2 overflow-y-auto max-h-[calc(70vh-100px)]">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            const showSeparator = index === 4; // Show separator before Discord
            
            return (
              <div key={item.label}>
                {showSeparator && (
                  <div className="h-px bg-white/10 mx-6 my-2" />
                )}
                <button
                  onClick={() => handleItemClick(item.label)}
                  className="w-full flex items-center gap-4 px-6 py-3 text-white hover:bg-white/5 transition-colors"
                >
                  {/* Icon */}
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    {item.customIcon === "discord" ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                      </svg>
                    ) : item.customIcon === "puzzle" ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                      </svg>
                    ) : IconComponent ? (
                      <IconComponent className="w-5 h-5" />
                    ) : null}
                  </div>
                  
                  {/* Label */}
                  <span className="flex-1 text-left text-base">{item.label}</span>
                  
                  {/* Action indicator */}
                  <div className="flex-shrink-0">
                    {item.hasExternalLink ? (
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    ) : item.hasChevron ? (
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    ) : null}
                  </div>
                </button>
              </div>
            );
          })}
        </div>

    </div>
  );
}
