# Logo Upload Feature

This feature allows administrators to upload and manage a custom logo for the site.

## Setup Instructions

### 1. Database Migration

Run the migrations to create the `site_settings` table and storage bucket:

**Via Supabase Dashboard (Recommended):**
1. Go to Supabase Dashboard → SQL Editor
2. Run `supabase/migrations/20241216000000_site_settings.sql`
3. Run `supabase/migrations/20241216000001_storage_assets.sql`

**Via Supabase CLI:**
```bash
supabase db push
```

### 2. Create Storage Bucket (if not using migration)

If the storage bucket isn't created automatically:

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `assets`
3. Make it **public** (allow public access)
4. Set policies to allow public read and admin write

### 3. Usage

1. Navigate to **Dashboard → Admin → Settings**
2. Click the **Branding** tab
3. Click **Upload Logo** button
4. Select your logo file (PNG, JPG, SVG, or WebP)
5. The logo will be uploaded to Supabase Storage and displayed across the site

### 4. File Requirements

- **Supported formats:** PNG, JPG, JPEG, SVG, WebP
- **Maximum file size:** 5MB
- **Recommended dimensions:** 200x50px (or similar aspect ratio)
- **Storage:** Files are stored in Supabase Storage bucket `assets` under `branding/`

## Technical Details

### API Endpoints

**POST /api/admin/upload-logo**
- Uploads a logo file
- Validates file type and size
- Saves to Supabase Storage (`assets` bucket)
- Stores metadata in `site_settings` table
- Returns public URL from Supabase Storage

**GET /api/admin/upload-logo**
- Retrieves current logo information
- Returns logo URL and metadata from database

### Database Schema

```sql
CREATE TABLE site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

Logo data structure:
```json
{
  "filename": "logo.png",
  "path": "branding/logo.png",
  "url": "https://your-project.supabase.co/storage/v1/object/public/assets/branding/logo.png",
  "uploadedAt": "2024-12-16T00:00:00.000Z"
}
```

### Components

- **LogoUploadSettings** (`app/dashboard/components/logo-upload-settings.tsx`)
  - Upload interface in admin settings
  - Preview current logo
  - Remove logo functionality

- **useLogo Hook** (`lib/hooks/use-logo.ts`)
  - React hook to fetch and use logo across the application
  - Automatically loads current logo on mount

### Integration

The logo is automatically displayed in:
- Dashboard header (replaces default Server Monitor branding)
- Any component that uses the `useLogo()` hook

To use the logo in other components:
```tsx
import { useLogo } from '@/lib/hooks/use-logo';
import Image from 'next/image';

export function MyComponent() {
  const { logo, isLoading } = useLogo();

  if (isLoading) return <div>Loading...</div>;
  
  return logo ? (
    <Image src={logo.url} alt="Logo" width={200} height={50} />
  ) : (
    <div>No logo uploaded</div>
  );
}
```

## Security Considerations

- Logo upload is restricted to admin users only
- File type validation prevents malicious uploads
- File size limited to 5MB
- RLS policies protect `site_settings` table
- Files stored in Supabase Storage with public read access
- Storage policies ensure only admins can upload/modify assets

## Storage Details

**Supabase Storage:**
- Bucket: `assets` (public)
- Path: `branding/logo.{extension}`
- Public URL automatically generated
- Old logos automatically deleted on replacement
- Works with serverless deployments (Vercel, etc.)

## Future Enhancements

Potential improvements:
- Support for dark mode alternative logo
- Favicon upload
- Logo positioning/sizing options
- Multiple brand assets (header logo, footer logo, etc.)
- Image optimization and compression
