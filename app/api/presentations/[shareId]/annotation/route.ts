import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { presentations, presenterAnnotations } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { broadcastToClients } from '@/lib/sse'
import { isPresentationOwner } from '@/lib/presenter-auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params
  
  try {
    if (!(await isPresentationOwner(shareId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const body = await request.json()
    const { slideIndex, annotationData } = body

    // Get presentation
    const presentation = await db
      .select()
      .from(presentations)
      .where(eq(presentations.shareId, shareId))
      .limit(1)

    if (!presentation.length) {
      return NextResponse.json({ error: 'Presentation not found' }, { status: 404 })
    }
    if (presentation[0].expiresAt <= new Date()) return NextResponse.json({ error: 'Presentation expired' }, { status: 403 })

    // Check if annotation already exists for this slide
    const existing = await db
      .select()
      .from(presenterAnnotations)
      .where(
        and(eq(presenterAnnotations.presentationId, presentation[0].id),
        eq(presenterAnnotations.slideIndex, slideIndex))
      )
      .limit(1)

    if (existing.length) {
      await db
        .update(presenterAnnotations)
        .set({ annotationData, updatedAt: new Date() })
        .where(eq(presenterAnnotations.id, existing[0].id))
    } else {
      await db.insert(presenterAnnotations).values({
        presentationId: presentation[0].id,
        slideIndex,
        annotationData,
      })
    }

    // Broadcast to all clients
    broadcastToClients(shareId, 'annotation-update', {
      slideIndex,
      annotationData,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Annotation error:', error)
    return NextResponse.json({ error: 'Failed to process annotation' }, { status: 500 })
  }
}
