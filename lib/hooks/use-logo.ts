import { useEffect, useState } from 'react';

export interface Logo {
  filename: string;
  url: string;
  uploadedAt: string;
}

export function useLogo() {
  const [logo, setLogo] = useState<Logo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await fetch('/api/admin/upload-logo', {
          cache: 'no-store',
        });
        const data = await response.json();
        if (data.logo) {
          // Add cache-busting timestamp to URL
          const logoUrl = data.logo.url.includes('?')
            ? `${data.logo.url}&t=${Date.now()}`
            : `${data.logo.url}?t=${Date.now()}`;
          setLogo({ ...data.logo, url: logoUrl });
        }
      } catch (error) {
        console.error('Failed to fetch logo:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogo();
  }, [refreshKey]);

  const refresh = () => setRefreshKey((prev) => prev + 1);

  return { logo, isLoading, refresh };
}
