import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { db } from '@/lib/db'
import { presentations } from '@/lib/db/schema'
import { nanoid } from 'nanoid'
import convert from 'libreoffice-convert'
import { promisify } from 'util'

const convertAsync = promisify(convert)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const expiryHours = parseInt(formData.get('expiryHours') as string) || 4
    const title = formData.get('title') as string

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Convert PPTX to PDF
    console.log('[v0] Converting PPTX to PDF...')
    let pdfBuffer: Buffer
    try {
      pdfBuffer = await convertAsync({
        data: buffer,
        format: 'pdf',
        fmt: 'pdf',
      }) as Buffer
    } catch (convertError) {
      console.error('[v0] Conversion error:', convertError)
      // Fallback: treat as already PDF or use original
      pdfBuffer = buffer
    }

    // Upload PDF to Vercel Blob
    const blob = await put(`${file.name.split('.')[0]}.pdf`, pdfBuffer, {
      access: 'public',
    })

    // Generate unique share ID
    const shareId = nanoid(12)

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000)

    // Store in database
    await db.insert(presentations).values({
      shareId,
      title: title || file.name,
      blobUrl: blob.url,
      expiresAt,
    })

    return NextResponse.json({
      shareId,
      message: 'Presentation uploaded successfully',
    })
  } catch (error) {
    console.error('[v0] Upload error:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
