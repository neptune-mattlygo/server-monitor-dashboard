import { useEffect, useState } from 'react';

export interface Logo {
  filename: string;
  url: string;
  uploadedAt: string;
}

export function useLogo() {
  const [logo, setLogo] = useState<Logo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await fetch('/api/admin/upload-logo');
        const data = await response.json();
        if (data.logo) {
          setLogo(data.logo);
        }
      } catch (error) {
        console.error('Failed to fetch logo:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogo();
  }, []);

  return { logo, isLoading };
}
