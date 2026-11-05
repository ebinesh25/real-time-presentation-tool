import { NextRequest, NextResponse } from 'next/server'
import { registerClient, unregisterClient } from '@/lib/sse'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params
  
  // Create a unique client ID
  const clientId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Create response stream
  const encoder = new TextEncoder()
  const customReadable = new ReadableStream({
    start(controller) {
      // Register this client
      registerClient(shareId, clientId, (data: string) => {
        controller.enqueue(encoder.encode(data))
      })

      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ connected: true })}\n\n`)
      )
    },
    cancel() {
      unregisterClient(shareId, clientId)
    },
  })

  return new NextResponse(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Content-Encoding': 'identity',
      'X-Accel-Buffering': 'no',
      Connection: 'keep-alive',
    },
  })
}
