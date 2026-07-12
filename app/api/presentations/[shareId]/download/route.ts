import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { presentations, presenterAnnotations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { PDFDocument } from 'pdf-lib'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params
  
  try {
    const body = await request.json()
    const { slideIndex, localAnnotations } = body

    // Get presentation
    const presentation = await db
      .select()
      .from(presentations)
      .where(eq(presentations.shareId, shareId))
      .limit(1)

    if (!presentation.length) {
      return NextResponse.json({ error: 'Presentation not found' }, { status: 404 })
    }

    // Get presenter annotations for this slide if exists
    const presenterAnnots = await db
      .select()
      .from(presenterAnnotations)
      .where(
        eq(presenterAnnotations.presentationId, presentation[0].id) &&
        eq(presenterAnnotations.slideIndex, slideIndex)
      )
      .limit(1)

    // Create a new PDF with the slide image and annotations
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([800, 600])

    // Add slide image
    if (localAnnotations?.slideImage) {
      // For data URLs from canvas, convert directly
      const base64Data = localAnnotations.slideImage.split(',')[1]
      if (base64Data) {
        const imageBytes = Buffer.from(base64Data, 'base64')
        const image = await pdfDoc.embedPng(imageBytes)
        page.drawImage(image, { x: 0, y: 0, width: 800, height: 600 })
      }
    }

    const pdfBytes = await pdfDoc.save()

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="slide-${slideIndex + 1}.pdf"`,
      },
    })
  } catch (error) {
    console.error('[v0] PDF download error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
