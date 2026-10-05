import React, { createContext, useContext, useState, useEffect } from 'react';

const PWAContext = createContext(null);

export const PWAProvider = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    // 1. Kiểm tra xem ứng dụng đã được cài đặt và đang chạy ở chế độ Standalone không
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://');
      
      setIsInstalled(isStandaloneMode);
      return isStandaloneMode;
    };

    const alreadyStandalone = checkStandalone();

    // 2. Nhận diện thiết bị iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleMobile = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);
    
    if (isAppleMobile && !alreadyStandalone) {
      setIsIOS(true);
      // Trên iOS Safari không có sự kiện beforeinstallprompt, nhưng người dùng có thể Add to Home Screen
      setIsInstallable(true);
    }

    // 3. Bắt sự kiện beforeinstallprompt (Android Chrome, Edge, Samsung Internet, Desktop Chrome)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log('✅ PWA: Nhận diện sự kiện beforeinstallprompt sẵn sàng cài đặt.');
    };

    // 4. Bắt sự kiện khi người dùng đã cài đặt thành công
    const handleAppInstalled = () => {
      console.log('🎉 PWA: Ứng dụng đã được cài đặt thành công!');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setBannerDismissed(true);
    };

    // Kiểm tra trạng thái đóng banner trong phiên
    if (sessionStorage.getItem('dnvn_pwa_dismissed') === 'true') {
      setBannerDismissed(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Hàm kích hoạt cài đặt PWA
  const installApp = async () => {
    if (isInstalled) {
      alert('Ứng dụng DoanhNghiepVN.today đã được cài đặt trên thiết bị của bạn.');
      return;
    }

    // Trường hợp Android / Desktop Chrome / Edge
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        console.log('PWA User Choice:', choiceResult.outcome);
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
          setIsInstallable(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn('Lỗi gọi PWA prompt:', err);
      }
      return;
    }

    // Trường hợp iOS Safari (iPhone / iPad)
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    // Fallback nếu trình duyệt không hỗ trợ trực tiếp prompt
    alert('Để cài đặt ứng dụng: Mở menu trình duyệt (biểu tượng 3 chấm hoặc chia sẻ) và chọn "Cài đặt ứng dụng" hoặc "Thêm vào màn hình chính".');
  };

  const dismissBanner = () => {
    setBannerDismissed(true);
    sessionStorage.setItem('dnvn_pwa_dismissed', 'true');
  };

  return (
    <PWAContext.Provider
      value={{
        isInstallable,
        isInstalled,
        isIOS,
        showIOSGuide,
        setShowIOSGuide,
        installApp,
        bannerDismissed,
        dismissBanner
      }}
    >
      {children}
    </PWAContext.Provider>
  );
};

export const usePWA = () => {
  const context = useContext(PWAContext);
  if (!context) {
    return {
      isInstallable: false,
      isInstalled: false,
      isIOS: false,
      showIOSGuide: false,
      setShowIOSGuide: () => {},
      installApp: () => {},
      bannerDismissed: true,
      dismissBanner: () => {}
    };
  }
  return context;
};

export default PWAContext;
