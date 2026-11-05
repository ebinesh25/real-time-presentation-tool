import { NextRequest, NextResponse } from 'next/server'
import { broadcastToClients } from '@/lib/sse'
import { isActivePresentationOwner } from '@/lib/presenter-auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params
  
  try {
    if (!(await isActivePresentationOwner(shareId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const body = await request.json()
    const { slideIndex } = body
    if (!Number.isInteger(slideIndex) || slideIndex < 0) return NextResponse.json({ error: 'Invalid slide' }, { status: 400 })

    // Broadcast to all connected clients
    broadcastToClients(shareId, 'slide-change', {
      slideIndex,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Slide change error:', error)
    return NextResponse.json({ error: 'Failed to process slide change' }, { status: 500 })
  }
}
