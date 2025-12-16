import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const STORAGE_BUCKET = 'assets';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('logo') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PNG, JPG, SVG, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Get file extension
    const extension = file.name.split('.').pop() || 'png';
    const fileName = `logo.${extension}`;
    const filePath = `branding/${fileName}`;

    // Delete existing logo if present
    const { data: existingLogo } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'logo')
      .single();

    if (existingLogo?.value?.path) {
      await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .remove([existingLogo.value.path]);
    }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: `Failed to upload to storage: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    // Store logo info in database
    const { error: dbError } = await supabaseAdmin
      .from('site_settings')
      .upsert({
        key: 'logo',
        value: {
          filename: fileName,
          path: filePath,
          url: publicUrl,
          uploadedAt: new Date().toISOString(),
        },
      }, {
        onConflict: 'key',
      });

    if (dbError) {
      console.error('Failed to save logo info to database:', dbError);
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      filename: fileName,
      url: publicUrl,
    });
  } catch (error: any) {
    console.error('Error uploading logo:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload logo' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'logo')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error;
    }

    return NextResponse.json({
      logo: data?.value || null,
    });
  } catch (error: any) {
    console.error('Error fetching logo:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch logo' },
      { status: 500 }
    );
  }
}
