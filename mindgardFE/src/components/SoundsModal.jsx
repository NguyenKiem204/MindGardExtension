import { useState } from "react";
import { X, Plus } from "lucide-react";

export default function SoundsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("Soundscapes");

  const tabs = ["Recent", "Soundscapes", "Spotify", "Youtube", "Custom"];

  const soundIcons = {
    rainfall: (
      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
      </svg>
    ),
    noise: (
      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
        <rect x="2" y="3" width="20" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="7" y="20" width="10" height="1.5" rx="0.5"/>
        <rect x="9" y="18" width="6" height="1" rx="0.5"/>
        <g opacity="0.6">
          <circle cx="6" cy="7" r="0.8"/>
          <circle cx="10" cy="7" r="0.8"/>
          <circle cx="14" cy="7" r="0.8"/>
          <circle cx="18" cy="7" r="0.8"/>
          <circle cx="8" cy="11" r="0.8"/>
          <circle cx="12" cy="11" r="0.8"/>
          <circle cx="16" cy="11" r="0.8"/>
          <circle cx="6" cy="14" r="0.8"/>
          <circle cx="10" cy="14" r="0.8"/>
          <circle cx="14" cy="14" r="0.8"/>
          <circle cx="18" cy="14" r="0.8"/>
        </g>
      </svg>
    ),
    binaural: (
      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 12h2m14 0h2M6 8v8m12-8v8M9 5v14m6-14v14" strokeLinecap="round"/>
      </svg>
    ),
    ocean: (
      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 3v4m0 10v4M3 12h4m10 0h4"/>
        <path d="M12 8l4 4m-4 0l4-4m-8 0l-4 4m4 0l-4-4" strokeLinecap="round"/>
      </svg>
    ),
    campfire: (
      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2s-4 3.5-4 7c0 2.2 1.8 4 4 4s4-1.8 4-4c0-3.5-4-7-4-7z" opacity="0.9"/>
        <path d="M6 20l6-2 6 2v2H6v-2z" opacity="0.7"/>
        <ellipse cx="12" cy="20" rx="8" ry="1" opacity="0.3"/>
      </svg>
    ),
    beach: (
      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3v8m-4-6v4m8-4v4"/>
        <circle cx="12" cy="14" r="3" fill="currentColor" opacity="0.3"/>
        <path d="M3 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0" strokeLinecap="round"/>
        <path d="M3 21c2-2 4-2 6 0s4 2 6 0 4-2 6 0" strokeLinecap="round"/>
      </svg>
    ),
    train: (
      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="4" width="16" height="12" rx="2"/>
        <path d="M4 11h16"/>
        <circle cx="8" cy="7.5" r="0.5" fill="currentColor"/>
        <circle cx="16" cy="7.5" r="0.5" fill="currentColor"/>
        <circle cx="8" cy="16" r="1.5"/>
        <circle cx="16" cy="16" r="1.5"/>
        <path d="M7 19l-2 2m12-2l2 2"/>
      </svg>
    ),
    forest: (
      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l-3 5h2l-2.5 5h2L8 17h8l-2.5-5h2l-2.5-5h2z" opacity="0.9"/>
        <rect x="11" y="17" width="2" height="5" opacity="0.6"/>
      </svg>
    ),
    garden: (
      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="3"/>
        <path d="M12 11v11M9 15c-2 0-3.5 1-3.5 3M15 15c2 0 3.5 1 3.5 3"/>
        <path d="M8 8c-1.5-1-3-1-4 0.5M16 8c1.5-1 3-1 4 0.5" strokeLinecap="round"/>
        <circle cx="12" cy="8" r="1.5" fill="currentColor"/>
      </svg>
    ),
    cafe: (
      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 8h1a4 4 0 0 1 0 8h-1"/>
        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/>
        <path d="M6 2v3M10 2v3M14 2v3" strokeLinecap="round"/>
      </svg>
    ),
    thunderstorm: (
      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" opacity="0.9"/>
      </svg>
    ),
    creek: (
      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0" strokeLinecap="round"/>
        <path d="M2 13c2-2 4-2 6 0s4 2 6 0 4-2 6 0" strokeLinecap="round"/>
        <path d="M2 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0" strokeLinecap="round"/>
      </svg>
    ),
    office: (
      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M9 3v18M3 9h18M3 15h6"/>
      </svg>
    ),
    custom: (
      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 18V5l12-2v13"/>
        <circle cx="6" cy="18" r="3"/>
        <circle cx="18" cy="16" r="3"/>
      </svg>
    )
  };

  const soundOptions = [
    {
      id: "lofi-hip-hop",
      name: "lofi hip hop ra...",
      thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop&crop=center",
      category: "recent"
    },
    {
      id: "synthwave",
      name: "synthwave ra...",
      thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200&h=200&fit=crop&crop=center",
      category: "recent"
    },
    {
      id: "rainfall",
      name: "Rainfall",
      thumbnail: "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=200&h=200&fit=crop&crop=center",
      category: "soundscapes"
    },
    {
      id: "noise",
      name: "Noise",
      thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop&crop=center",
      category: "soundscapes"
    },
    {
      id: "binaural",
      name: "Binaural",
      thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop&crop=center",
      category: "soundscapes"
    },
    {
      id: "ocean",
      name: "Ocean",
      thumbnail: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&h=200&fit=crop&crop=center",
      category: "soundscapes"
    },
    {
      id: "campfire",
      name: "Campfire",
      thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop&crop=center",
      category: "soundscapes"
    },
    {
      id: "beach",
      name: "Beach",
      thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop&crop=center",
      category: "soundscapes"
    },
    {
      id: "train",
      name: "Train",
      thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop&crop=center",
      category: "soundscapes"
    },
    {
      id: "forest",
      name: "Forest",
      thumbnail: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200&h=200&fit=crop&crop=center",
      category: "soundscapes"
    },
    {
      id: "garden",
      name: "Garden",
      thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop&crop=center",
      category: "soundscapes"
    },
    {
      id: "cafe",
      name: "Café",
      thumbnail: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200&h=200&fit=crop&crop=center",
      category: "soundscapes"
    },
    {
      id: "thunderstorm",
      name: "Thunderstorm",
      thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop&crop=center",
      category: "soundscapes"
    },
    {
      id: "creek",
      name: "Creek",
      thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop&crop=center",
      category: "soundscapes"
    },
    {
      id: "office",
      name: "Office",
      thumbnail: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&h=200&fit=crop&crop=center",
      category: "soundscapes"
    },
    {
      id: "custom",
      name: "Custom",
      thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop&crop=center",
      category: "custom"
    }
  ];

  const moodTags = ["Deep", "Focus", "Positive", "Classical"];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-start p-4" onClick={onClose}>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
      <div 
        className="bg-[#2a2a2a] rounded-2xl w-full max-w-sm max-h-[50vh] overflow-hidden shadow-2xl mb-20 ml-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-700/50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 12a7.971 7.971 0 00-1.343-4.243 1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
          </div>
            <h2 className="text-lg font-semibold text-white">Sounds</h2>
        </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700/50 hover:bg-gray-600 rounded-lg text-white transition-colors">
            <Plus className="w-3 h-3" />
            <span className="text-xs font-medium">Add</span>
          </button>
      </div>

        {/* Tabs */}
        <div className="flex gap-1 px-3 pt-3">
          {tabs.map((tab) => (
          <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                activeTab === tab
                  ? "bg-gray-600 text-white"
                  : "bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-gray-300"
              }`}
            >
              {tab}
          </button>
        ))}
      </div>

        {/* Content */}
        <div className="p-3 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(50vh - 140px)' }}>
          <div className="grid grid-cols-5 gap-2">
            {soundOptions
              .filter(sound => {
                if (activeTab === "Recent") return sound.category === "recent";
                return sound.category === activeTab.toLowerCase();
              })
              .map((sound) => (
                <div
                  key={sound.id}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden hover:scale-105 transition-transform duration-200">
                    <img
                      src={sound.thumbnail}
                      alt={sound.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      {soundIcons[sound.id]}
                    </div>
                  </div>
                  <div className="mt-1">
                    <h3 className="text-white font-medium text-xs text-center">{sound.name}</h3>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Mood Tags */}
        <div className="px-3 py-3 border-t border-gray-700/50">
          <div className="flex gap-1.5 flex-wrap">
            {moodTags.map((tag) => (
              <button
                key={tag}
                className="px-2.5 py-1 bg-gray-700/50 hover:bg-gray-600 rounded-full text-white text-xs transition-colors"
              >
                {tag}
              </button>
            ))}
        </div>
        </div>
      </div>
    </div>
  );
}