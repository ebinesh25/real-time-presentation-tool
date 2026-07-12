import { NextRequest, NextResponse } from 'next/server'
import { getClients, broadcastToClients } from '@/lib/sse'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params
  
  try {
    const body = await request.json()
    const { slideIndex } = body

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
