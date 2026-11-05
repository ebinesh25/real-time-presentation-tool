import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { presentations, presentationOwners } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params
  
  try {
    // Get presentation
    const presentation = await db
      .select({ title: presentations.title, blobUrl: presentations.blobUrl, originalBlobUrl: presentationOwners.originalBlobUrl, originalFilename: presentationOwners.originalFilename })
      .from(presentations)
      .leftJoin(presentationOwners, eq(presentationOwners.presentationId, presentations.id))
      .where(eq(presentations.shareId, shareId))
      .limit(1)

    if (!presentation.length) {
      return NextResponse.json({ error: 'Presentation not found' }, { status: 404 })
    }

    const file = presentation[0]
    const fileResponse = await fetch(file.originalBlobUrl || file.blobUrl)
    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch presentation file (${fileResponse.status})`)
    }
    const fileTitle = file.title.replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '') || 'presentation'
    const filename = (file.originalFilename || `${fileTitle}.pdf`).replace(/[\r\n"\\/]/g, '_')
    return new NextResponse(await fileResponse.arrayBuffer(), {
      headers: {
        'Content-Type': file.originalBlobUrl ? 'application/octet-stream' : 'application/pdf',
        'Content-Disposition': `attachment; filename="presentation${file.originalBlobUrl ? (filename.toLowerCase().endsWith('.pptx') ? '.pptx' : '.ppt') : '.pdf'}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    })
  } catch (error) {
    console.error('[v0] PDF download error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
