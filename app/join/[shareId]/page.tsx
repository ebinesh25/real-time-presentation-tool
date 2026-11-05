import { db } from '@/lib/db'
import { presentations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { PresentationViewer } from '@/components/presentation-viewer'
import { notFound } from 'next/navigation'

export default async function JoinPage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params
  const [presentation] = await db.select().from(presentations).where(eq(presentations.shareId, shareId)).limit(1)
  if (!presentation) notFound()
  return <PresentationViewer presentation={presentation} isActive={new Date() < presentation.expiresAt} shareId={shareId} isPresenter={false} />
}
