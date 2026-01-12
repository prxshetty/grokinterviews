

// SVG Illustrations for domain cards
export const AIIllustration = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 160" className={className}>
    <defs>
      <linearGradient id="aiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#A855F7" />
      </linearGradient>
    </defs>
    <circle cx="100" cy="80" r="60" fill="url(#aiGrad)" opacity="0.1" />
    <circle cx="100" cy="80" r="40" fill="url(#aiGrad)" opacity="0.2" />
    <circle cx="100" cy="80" r="20" fill="url(#aiGrad)" opacity="0.4" />
    <path d="M80 70 Q100 50 120 70 Q100 90 80 70" fill="url(#aiGrad)" opacity="0.6" />
    <circle cx="90" cy="75" r="3" fill="#8B5CF6" />
    <circle cx="110" cy="75" r="3" fill="#8B5CF6" />
    <path d="M95 85 Q100 90 105 85" stroke="#8B5CF6" strokeWidth="2" fill="none" />
  </svg>
);

export const MLIllustration = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 160" className={className}>
    <defs>
      <linearGradient id="mlGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>
    </defs>
    <rect x="40" y="100" width="8" height="40" fill="url(#mlGrad)" opacity="0.6" />
    <rect x="60" y="80" width="8" height="60" fill="url(#mlGrad)" opacity="0.7" />
    <rect x="80" y="60" width="8" height="80" fill="url(#mlGrad)" opacity="0.8" />
    <rect x="100" y="40" width="8" height="100" fill="url(#mlGrad)" opacity="0.9" />
    <rect x="120" y="70" width="8" height="70" fill="url(#mlGrad)" opacity="0.8" />
    <rect x="140" y="90" width="8" height="50" fill="url(#mlGrad)" opacity="0.7" />
    <path d="M45 105 Q75 45 105 45 Q135 75 145 95" stroke="#3B82F6" strokeWidth="3" fill="none" opacity="0.8" />
  </svg>
);

export const SystemDesignIllustration = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 160" className={className}>
    <defs>
      <linearGradient id="sysGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    <circle cx="60" cy="60" r="15" fill="url(#sysGrad)" opacity="0.8" />
    <circle cx="140" cy="60" r="15" fill="url(#sysGrad)" opacity="0.8" />
    <circle cx="100" cy="100" r="15" fill="url(#sysGrad)" opacity="0.8" />
    <circle cx="60" cy="130" r="15" fill="url(#sysGrad)" opacity="0.8" />
    <circle cx="140" cy="130" r="15" fill="url(#sysGrad)" opacity="0.8" />
    <line x1="75" y1="60" x2="125" y2="60" stroke="#10B981" strokeWidth="3" opacity="0.6" />
    <line x1="70" y1="70" x2="90" y2="90" stroke="#10B981" strokeWidth="3" opacity="0.6" />
    <line x1="130" y1="70" x2="110" y2="90" stroke="#10B981" strokeWidth="3" opacity="0.6" />
    <line x1="90" y1="110" x2="70" y2="120" stroke="#10B981" strokeWidth="3" opacity="0.6" />
    <line x1="110" y1="110" x2="130" y2="120" stroke="#10B981" strokeWidth="3" opacity="0.6" />
  </svg>
);

export const DSAIllustration = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 160" className={className}>
    <defs>
      <linearGradient id="dsaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>
    <rect x="50" y="50" width="20" height="20" fill="url(#dsaGrad)" opacity="0.8" />
    <rect x="80" y="50" width="20" height="20" fill="url(#dsaGrad)" opacity="0.6" />
    <rect x="110" y="50" width="20" height="20" fill="url(#dsaGrad)" opacity="0.8" />
    <rect x="50" y="80" width="20" height="20" fill="url(#dsaGrad)" opacity="0.6" />
    <rect x="80" y="80" width="20" height="20" fill="url(#dsaGrad)" opacity="0.9" />
    <rect x="110" y="80" width="20" height="20" fill="url(#dsaGrad)" opacity="0.6" />
    <rect x="50" y="110" width="20" height="20" fill="url(#dsaGrad)" opacity="0.8" />
    <rect x="80" y="110" width="20" height="20" fill="url(#dsaGrad)" opacity="0.6" />
    <rect x="110" y="110" width="20" height="20" fill="url(#dsaGrad)" opacity="0.8" />
    <path d="M140 70 L160 50 L180 70 L160 90 Z" fill="url(#dsaGrad)" opacity="0.7" />
  </svg>
);

export const WebDevIllustration = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 160" className={className}>
    <defs>
      <linearGradient id="webGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6366F1" />
        <stop offset="100%" stopColor="#4F46E5" />
      </linearGradient>
    </defs>
    <rect x="50" y="40" width="100" height="80" rx="8" fill="url(#webGrad)" opacity="0.1" />
    <rect x="50" y="40" width="100" height="15" rx="8" fill="url(#webGrad)" opacity="0.8" />
    <circle cx="60" cy="47.5" r="2.5" fill="#6366F1" />
    <circle cx="70" cy="47.5" r="2.5" fill="#6366F1" />
    <circle cx="80" cy="47.5" r="2.5" fill="#6366F1" />
    <rect x="60" y="65" width="30" height="8" fill="url(#webGrad)" opacity="0.6" />
    <rect x="60" y="80" width="50" height="4" fill="url(#webGrad)" opacity="0.4" />
    <rect x="60" y="90" width="40" height="4" fill="url(#webGrad)" opacity="0.4" />
    <rect x="120" y="65" width="20" height="25" fill="url(#webGrad)" opacity="0.5" />
  </svg>
);

// Mapping object for domain illustrations
export const DOMAIN_ILLUSTRATIONS = {
  ai: AIIllustration,
  ml: MLIllustration,
  sdesign: SystemDesignIllustration,
  dsa: DSAIllustration,
  webdev: WebDevIllustration,
  other: AIIllustration, // Default illustration
} as const;