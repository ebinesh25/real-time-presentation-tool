import { NextRequest, NextResponse } from 'next/server'
import { isPresentationOwner } from '@/lib/presenter-auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params
  return NextResponse.json({ isPresenter: await isPresentationOwner(shareId) })
}
