'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import Image from 'next/image';

export function LogoUploadSettings() {
  const [logo, setLogo] = useState<{ url: string; filename: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCurrentLogo();
  }, []);

  const fetchCurrentLogo = async () => {
    try {
      const response = await fetch('/api/admin/upload-logo');
      const data = await response.json();
      if (data.logo) {
        setLogo(data.logo);
      }
    } catch (err) {
      console.error('Failed to fetch logo:', err);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch('/api/admin/upload-logo', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload logo');
      }

      setLogo({
        url: data.url,
        filename: data.filename,
      });
      setSuccess('Logo uploaded successfully!');
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload logo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogo(null);
    setSuccess('Logo removed. Upload a new one to replace it.');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Site Logo</CardTitle>
        <CardDescription>
          Upload your logo to display across the site. Recommended size: 200x50px. Maximum file size: 5MB.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
          </div>
        )}

        {logo && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Current Logo</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveLogo}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>
            <div className="relative bg-gray-50 dark:bg-gray-800 rounded-lg p-8 flex items-center justify-center">
              <Image
                src={logo.url}
                alt="Site logo"
                width={200}
                height={50}
                className="max-h-20 w-auto object-contain"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Filename: {logo.filename}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
              onChange={handleFileSelect}
              className="hidden"
              id="logo-upload"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {logo ? 'Replace Logo' : 'Upload Logo'}
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Supported formats: PNG, JPG, SVG, WebP • Maximum size: 5MB
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
