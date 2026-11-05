import { NextRequest, NextResponse } from 'next/server'
import { del, put } from '@vercel/blob'
import { db } from '@/lib/db'
import { presentationOwners, presentations } from '@/lib/db/schema'
import { createPresenterToken, hashPresenterToken, presenterCookieName } from '@/lib/presenter-auth'
import { nanoid } from 'nanoid'
import { convert } from 'libreoffice-convert'
import { promisify } from 'util'

const convertAsync = promisify(convert)

export async function POST(request: NextRequest) {
  const uploadedUrls: string[] = []
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
      pdfBuffer = await convertAsync(buffer, 'pdf', undefined) as Buffer
    } catch (convertError) {
      console.error('[v0] Conversion error:', convertError)
      return NextResponse.json({ message: 'Could not convert the PowerPoint file to PDF.' }, { status: 500 })
    }

    // Upload PDF to Vercel Blob
    const blob = await put(`${file.name.split('.')[0]}.pdf`, pdfBuffer, {
      access: 'public',
      addRandomSuffix: true,
    })
    uploadedUrls.push(blob.url)
    const original = await put(file.name, buffer, { access: 'public', addRandomSuffix: true })
    uploadedUrls.push(original.url)

    // Generate unique share ID
    const shareId = nanoid(12)
    const presenterToken = createPresenterToken()

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000)

    // Store in database
    await db.transaction(async (tx) => {
      const [presentation] = await tx.insert(presentations).values({
        shareId,
        title: title || file.name,
        blobUrl: blob.url,
        expiresAt,
      }).returning({ id: presentations.id })
      await tx.insert(presentationOwners).values({
        presentationId: presentation.id,
        tokenHash: hashPresenterToken(presenterToken),
        originalBlobUrl: original.url,
        originalFilename: file.name,
      })
    })

    const response = NextResponse.json({
      shareId,
      message: 'Presentation uploaded successfully',
    })
    response.cookies.set(presenterCookieName(shareId), presenterToken, {
      httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production',
      path: '/', maxAge: 60 * 60 * 24 * 30,
    })
    return response
  } catch (error) {
    if (uploadedUrls.length) await del(uploadedUrls).catch((cleanupError) => console.error('Blob cleanup failed:', cleanupError))
    console.error('[v0] Upload error:', error)
    return NextResponse.json(
      { message: 'Upload failed. Please try again.' },
      { status: 500 }
    )
  }
}
