import { NextRequest, NextResponse } from 'next/server'
import { setPresenterStatus } from '@/lib/sse'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params
  const cookie = request.headers.get('cookie')
  
  // Check if this is the presenter (first client or has presenter cookie)
  const isPresenter = !cookie || !cookie.includes('viewer=true')

  // Set presenter status for this share
  setPresenterStatus(shareId, isPresenter)

  return NextResponse.json({ isPresenter })
}
