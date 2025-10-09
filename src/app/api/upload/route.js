// app/api/upload/route.js
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const filename = formData.get('filename');
    const contentType = formData.get('contentType');

    // Validate inputs
    if (!file || !filename || !contentType) {
      return NextResponse.json(
        { error: 'File, filename, and contentType are required' },
        { status: 400 }
      );
    }

    // Additional validation for file size and type
    const supportedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!supportedTypes.includes(contentType)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Use PNG, JPG, or PDF.' },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // Upload the file to Vercel Blob
    const { url } = await put(filename, file, {
      access: 'public',
      contentType,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
    });

    return NextResponse.json(
      { downloadUrl: url },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in /api/upload:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}