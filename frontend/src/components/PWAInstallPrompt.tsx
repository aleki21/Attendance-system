import React, { useState, useEffect } from 'react';
import { X, Smartphone } from 'lucide-react'; // Removed unused Download import

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
      return;
    }

    // Check for iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for beforeinstallprompt event
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Only show prompt if not iOS (iOS doesn't support beforeinstallprompt)
      if (!isIOSDevice) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if we should show iOS instructions
    if (isIOSDevice && !localStorage.getItem('hasSeenIOSInstructions')) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
      localStorage.setItem('pwaInstalled', 'true');
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    if (isIOS) {
      localStorage.setItem('hasSeenIOSInstructions', 'true');
    }
  };

  // Don't show if already in standalone mode or user dismissed
  if (isStandalone) return null;
  if (localStorage.getItem('pwaInstalled') === 'true') return null;

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:max-w-sm bg-white rounded-2xl shadow-lg border border-gray-200 p-4 z-50 animate-in slide-in-from-bottom-4">
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-teal-100 rounded-lg flex-shrink-0">
          <Smartphone className="h-5 w-5 text-teal-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm mb-1">
            Install Repentance App
          </h3>
          <p className="text-gray-600 text-xs mb-3">
            {isIOS 
              ? 'Add to home screen for quick access and better experience'
              : 'Install for quick access and offline functionality'
            }
          </p>
          <div className="flex space-x-2">
            {!isIOS && deferredPrompt && (
              <button
                onClick={handleInstall}
                className="flex-1 bg-teal-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
              >
                Install
              </button>
            )}
            <button
              onClick={handleDismiss}
              className={`${
                isIOS ? 'w-full' : 'flex-1'
              } bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors`}
            >
              {isIOS ? 'Not Now' : 'Later'}
            </button>
          </div>
          {isIOS && (
            <p className="text-xs text-gray-500 mt-2">
              Tap <span className="font-medium">Share</span> → <span className="font-medium">Add to Home Screen</span>
            </p>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1 flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;