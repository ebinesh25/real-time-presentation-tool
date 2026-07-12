import { db } from '@/lib/db'
import { presentations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { PresentationViewer } from '@/components/presentation-viewer'
import { notFound } from 'next/navigation'

export default async function PresentPage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params
  
  const presentation = await db
    .select()
    .from(presentations)
    .where(eq(presentations.shareId, shareId))
    .limit(1)

  if (!presentation.length) {
    notFound()
  }

  const pres = presentation[0]
  const isActive = new Date() < pres.expiresAt

  return (
    <PresentationViewer
      presentation={pres}
      isActive={isActive}
      shareId={shareId}
    />
  )
}
