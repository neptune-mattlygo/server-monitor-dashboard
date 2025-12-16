import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { supabaseAdmin } from '@/lib/supabase';

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

    // Save to public directory
    const publicDir = join(process.cwd(), 'public');
    
    // Ensure public directory exists
    if (!existsSync(publicDir)) {
      await mkdir(publicDir, { recursive: true });
    }

    const filePath = join(publicDir, fileName);
    await writeFile(filePath, buffer);

    // Store logo info in database
    const { error: dbError } = await supabaseAdmin
      .from('site_settings')
      .upsert({
        key: 'logo',
        value: {
          filename: fileName,
          url: `/${fileName}`,
          uploadedAt: new Date().toISOString(),
        },
      }, {
        onConflict: 'key',
      });

    if (dbError) {
      console.error('Failed to save logo info to database:', dbError);
      // Continue anyway since file is saved
    }

    return NextResponse.json({
      success: true,
      filename: fileName,
      url: `/${fileName}`,
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
