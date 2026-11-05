'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AnnotationCanvas } from '@/components/annotation-canvas'
import { createSlideSync } from '@/lib/slide-sync'
import QRCode from 'qrcode'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  LogOut,
  Maximize2,
  Minimize2,
  Presentation as PresentationIcon,
  CircleHelp,
  Copy,
  Check,
  ArrowLeft,
  ArrowUpRight,
  Clock3,
  Keyboard,
  Link2,
  Play,
  QrCode,
  Users,
  X,
} from 'lucide-react'

interface Presentation {
  id: number
  shareId: string
  title: string
  blobUrl: string
  expiresAt: Date
  createdAt: Date | null
}

export function PresentationViewer({
  presentation,
  isActive,
  shareId,
  isPresenter,
}: {
  presentation: Presentation
  isActive: boolean
  shareId: string
  isPresenter: boolean
}) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [totalSlides, setTotalSlides] = useState(0)
  const [slides, setSlides] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [presenterAnnotations, setPresenterAnnotations] = useState<Record<number, any>>({})
  const [currentAnnotationData, setCurrentAnnotationData] = useState<any>(null)
  const [downloading, setDownloading] = useState(false)
  const [isPresentationMode, setIsPresentationMode] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [copyStatus, setCopyStatus] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [showQrCode, setShowQrCode] = useState(true)
  const [viewerCount, setViewerCount] = useState(0)
  const [syncError, setSyncError] = useState('')
  const currentSlideRef = useRef(0)
  const slideSyncRef = useRef<ReturnType<typeof createSlideSync> | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const presentationRef = useRef<HTMLElement | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!isPresenter || !isActive) return
    const sync = createSlideSync(async (slideIndex) => {
      const response = await fetch(`/api/presentations/${shareId}/slide-change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slideIndex }),
      })
      if (!response.ok) throw new Error('Slide update failed')
      setSyncError('')
    }, () => setSyncError('Could not sync the slide. Change slides to try again.'))
    slideSyncRef.current = sync
    return () => {
      sync.dispose()
      slideSyncRef.current = null
    }
  }, [shareId, isPresenter, isActive])

  useEffect(() => {
    setShareUrl(`${window.location.origin}/join/${encodeURIComponent(shareId)}`)
  }, [shareId])

  useEffect(() => {
    if (!shareUrl) return
    let cancelled = false
    QRCode.toDataURL(shareUrl, {
      width: 240,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#17191c', light: '#ffffff' },
    }).then((dataUrl) => {
      if (!cancelled) setQrCode(dataUrl)
    }).catch((error) => console.error('[presentation] QR generation failed:', error))
    return () => { cancelled = true }
  }, [shareUrl])

  const copyShareLink = async () => {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(shareUrl)
      setCopyStatus('Link copied')
    } catch {
      setCopyStatus(isPresenter ? 'Select and copy the viewer link above' : 'Copy the link from your address bar')
    }
  }

  // Load PDF slides
  useEffect(() => {
    const loadPdf = async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
        const blobUrl = presentation.blobUrl?.trim()
        if (!blobUrl) {
          throw new Error('Presentation PDF URL is missing')
        }

        const pdf = await pdfjsLib.getDocument({ url: blobUrl }).promise
        const numPages = pdf.numPages
        setTotalSlides(numPages)

        const slideUrls: string[] = []
        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i)
          const viewport = page.getViewport({ scale: 2 })
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')!
          canvas.width = viewport.width
          canvas.height = viewport.height

          await page.render({
            canvasContext: context,
            canvas,
            viewport,
          }).promise

          slideUrls.push(canvas.toDataURL('image/png'))
        }
        setSlides(slideUrls)
        setLoading(false)
      } catch (error) {
        console.error('[v0] PDF loading error:', error)
        setLoading(false)
      }
    }

    loadPdf()
  }, [presentation.blobUrl])

  // Setup SSE connection for live updates
  useEffect(() => {
    if (!isActive) return

    const eventSource = new EventSource(`/api/presentations/${shareId}/subscribe${isPresenter ? '?role=presenter' : ''}`)

    eventSource.addEventListener('viewer-count', (event) => {
      if (!isPresenter) return
      const data = JSON.parse(event.data)
      if (Number.isInteger(data.viewerCount) && data.viewerCount >= 0) setViewerCount(data.viewerCount)
    })

    eventSource.addEventListener('slide-change', (event) => {
      if (isPresenter) return
      const data = JSON.parse(event.data)
      if (Number.isInteger(data.slideIndex) && data.slideIndex >= 0) {
        currentSlideRef.current = data.slideIndex
        setCurrentSlide(data.slideIndex)
      }
    })

    eventSource.addEventListener('annotation-update', (event) => {
      const data = JSON.parse(event.data)
      setPresenterAnnotations((prev) => ({
        ...prev,
        [data.slideIndex]: data.annotationData,
      }))
    })

    eventSource.onerror = () => {
      eventSource.close()
    }

    eventSourceRef.current = eventSource

    return () => {
      eventSource.close()
    }
  }, [shareId, isActive, isPresenter])

  // Handle slide navigation
  const goToSlide = (slideIndex: number) => {
    const newSlide = Math.max(0, Math.min(slideIndex, totalSlides - 1))
    if (newSlide === currentSlideRef.current) return
    currentSlideRef.current = newSlide
    setCurrentSlide(newSlide)
    if (isPresenter && isActive) slideSyncRef.current?.schedule(newSlide)
  }

  const handlePrevSlide = () => goToSlide(currentSlideRef.current - 1)
  const handleNextSlide = () => goToSlide(currentSlideRef.current + 1)

  const handleAnnotationSave = (annotationData: any) => {
    setCurrentAnnotationData(annotationData)
    if (isPresenter && isActive) {
      fetch(`/api/presentations/${shareId}/annotation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slideIndex: currentSlide,
          annotationData,
        }),
      })
    }
  }

  const handleDownloadPdf = async () => {
    setDownloading(true)
    try {
      const response = await fetch(`/api/presentations/${shareId}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slideIndex: currentSlide,
          localAnnotations: currentAnnotationData || { slideImage: slides[currentSlide] },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to download PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const encodedFilename = response.headers.get('Content-Disposition')?.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
      a.download = encodedFilename ? decodeURIComponent(encodedFilename) : 'presentation.pdf'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('[v0] Download error:', error)
      alert('Failed to download PDF')
    } finally {
      setDownloading(false)
    }
  }

  const togglePresentationMode = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
      return
    }

    setIsPresentationMode(true)
    try {
      await presentationRef.current?.requestFullscreen()
    } catch (error) {
      // The CSS presentation mode remains useful when fullscreen is blocked.
      console.warn('[v0] Fullscreen request was blocked:', error)
    }
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTyping = target?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '')
      if (isTyping) return

      const key = event.key.toLowerCase()
      const nextKeys = ['arrowright', 'arrowdown', 'pagedown', ' ']
      const previousKeys = ['arrowleft', 'arrowup', 'pageup']
      const canControlSlides = !isActive || isPresenter

      if (nextKeys.includes(key)) {
        event.preventDefault()
        if (canControlSlides) handleNextSlide()
      } else if (previousKeys.includes(key)) {
        event.preventDefault()
        if (canControlSlides) handlePrevSlide()
      } else if (key === 'home') {
        event.preventDefault()
        if (canControlSlides) goToSlide(0)
      } else if (key === 'end') {
        event.preventDefault()
        if (canControlSlides) goToSlide(totalSlides - 1)
      } else if (key === 'p' || key === 'f') {
        event.preventDefault()
        void togglePresentationMode()
      } else if (key === '?' || (event.shiftKey && key === '/')) {
        event.preventDefault()
        setShowShortcuts((visible) => !visible)
      } else if (key === 'escape') {
        if (showShortcuts) {
          setShowShortcuts(false)
        } else if (document.fullscreenElement) {
          void document.exitFullscreen()
        } else if (isPresentationMode) {
          setIsPresentationMode(false)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isPresentationMode, showShortcuts, totalSlides, currentSlide, isPresenter, isActive])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsPresentationMode(Boolean(document.fullscreenElement))
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading presentation...</p>
        </div>
      </main>
    )
  }

  const isPresenterWorkspace = isPresenter && !isPresentationMode
  const slide = slides[currentSlide]
  const canNavigate = isPresenter || !isActive

  return (
    <main
      ref={presentationRef}
      className={
        isPresenterWorkspace
          ? 'min-h-screen bg-[#f7f8fa] text-[#17191c]'
          : 'min-h-screen bg-[#0a0a0c] text-white'
      }
    >
      {syncError && <p role="alert" className="fixed bottom-4 right-4 z-50 rounded-lg bg-red-700 px-4 py-2 text-sm text-white">{syncError}</p>}
      {isPresenterWorkspace ? (
        <div className="min-h-screen bg-[#f6f7fb]">
          <header className="border-b border-[#e8eaf1] bg-white">
            <div className="mx-auto flex min-h-16 max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-7 lg:px-10">
              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <Button variant="ghost" size="icon" aria-label="Back to home" className="size-9 rounded-xl text-[#697080] hover:bg-[#f1f2f8] hover:text-[#252a39]" onClick={() => router.push('/')}><ArrowLeft /></Button>
                <div className="hidden size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white sm:flex"><PresentationIcon className="size-[18px]" /></div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b91a0]">Presenter workspace</p>
                  <h1 className="truncate text-sm font-semibold text-[#202433] sm:text-base">{presentation.title}</h1>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold tabular-nums text-indigo-700"><Users className="size-3.5" /> {viewerCount} viewing</span>
                <span className={`hidden items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold sm:inline-flex ${isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-[#f0f1f5] text-[#737988]'}`}><span className={`size-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-[#9ca3af]'}`} />{isActive ? 'Session active' : 'View only'}</span>
                <Button variant="ghost" size="icon" aria-label="Keyboard shortcuts" className="size-9 rounded-xl text-[#697080] hover:bg-[#f1f2f8]" onClick={() => setShowShortcuts(true)}><CircleHelp /></Button>
                <Button onClick={togglePresentationMode} className="h-10 rounded-xl bg-indigo-600 px-4 text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 sm:px-5"><Play className="size-4 fill-current" /> <span>Present</span></Button>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1600px] px-4 pb-10 pt-6 sm:px-7 sm:pt-8 lg:px-10">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Your presentation</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#202433] sm:text-3xl">Ready to present.</h2>
                <p className="mt-1.5 text-sm text-[#7b8190]">Navigate your slides and invite your audience.</p>
              </div>
              <div className="hidden items-center gap-2 text-xs text-[#8a90a0] md:flex"><Keyboard className="size-4" /> Use arrow keys to navigate <button type="button" onClick={() => setShowShortcuts(true)} className="font-semibold text-indigo-600 hover:text-indigo-700">View shortcuts</button></div>
            </div>

            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              <section aria-label="Presentation controls" className="min-w-0 space-y-4">
                <div className="overflow-hidden rounded-2xl border border-[#e5e7ef] bg-white shadow-[0_8px_30px_rgba(30,35,65,0.04)]">
                  <div className="flex items-center justify-between gap-3 border-b border-[#f0f1f5] px-4 py-3 sm:px-5">
                    <div className="flex items-center gap-2.5"><span className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><PresentationIcon className="size-4" /></span><div><p className="text-sm font-semibold text-[#2b3040]">Current slide</p><p className="text-[11px] text-[#9298a6]">Your presentation canvas</p></div></div>
                    <span className="rounded-lg bg-[#f4f5f9] px-2.5 py-1.5 text-xs font-semibold tabular-nums text-[#737988]">{currentSlide + 1} <span className="text-[#c0c4ce]">/</span> {totalSlides}</span>
                  </div>
                  <div className="bg-[#202332] p-3 sm:p-5 lg:p-6">
                    <div className="mx-auto aspect-video w-full max-w-[1100px] overflow-hidden rounded-lg bg-black shadow-2xl shadow-black/20">
                      {slide && <AnnotationCanvas slideImage={slide} presenterAnnotations={presenterAnnotations[currentSlide]} isPresenter={canNavigate} onAnnotationSave={handleAnnotationSave} />}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
                    <p className="hidden text-xs text-[#8a90a0] sm:block">Use the tools above to annotate your slide</p>
                    <div className="flex items-center gap-2 sm:ml-auto">
                      <Button variant="outline" size="icon" aria-label="Previous slide" className="size-9 border-[#e5e7ef] bg-white text-[#444b5c]" onClick={handlePrevSlide} disabled={currentSlide === 0 || !canNavigate}><ChevronLeft /></Button>
                      <span className="min-w-20 text-center text-xs font-semibold tabular-nums text-[#777e8e]">{currentSlide + 1} of {totalSlides}</span>
                      <Button variant="outline" size="icon" aria-label="Next slide" className="size-9 border-[#e5e7ef] bg-white text-[#444b5c]" onClick={handleNextSlide} disabled={currentSlide === totalSlides - 1 || !canNavigate}><ChevronRight /></Button>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#e5e7ef] bg-white p-4 shadow-[0_8px_30px_rgba(30,35,65,0.03)] sm:p-5">
                  <div className="mb-3 flex items-center justify-between"><div><h3 className="text-sm font-semibold text-[#2b3040]">Your slides</h3><p className="mt-0.5 text-xs text-[#969ba8]">Select a slide to jump to it</p></div><span className="text-xs font-medium text-[#9ba1ae]">{totalSlides} {totalSlides === 1 ? 'slide' : 'slides'}</span></div>
                  <div className="flex gap-3 overflow-x-auto pb-1" aria-label="Slide thumbnails">
                    {slides.map((thumbnail, index) => (
                      <button key={index} type="button" onClick={() => goToSlide(index)} aria-label={`Go to slide ${index + 1}`} aria-current={currentSlide === index ? 'true' : undefined} className={`group w-28 shrink-0 rounded-xl border-2 p-1.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:w-32 ${currentSlide === index ? 'border-indigo-500 bg-indigo-50' : 'border-transparent bg-[#f5f6fa] hover:border-[#d7dbea]'}`}>
                        <img src={thumbnail} alt="" className="aspect-video w-full rounded-md bg-white object-contain" />
                        <span className={`block px-0.5 pt-1.5 text-[11px] font-semibold ${currentSlide === index ? 'text-indigo-600' : 'text-[#8b91a0]'}`}>Slide {index + 1}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <aside aria-label="Sharing and session details" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-2xl border border-[#e5e7ef] bg-white p-5 shadow-[0_8px_30px_rgba(30,35,65,0.04)]">
                  <div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Link2 className="size-[18px]" /></span><div><h2 className="text-sm font-semibold text-[#252a39]">Invite your audience</h2><p className="mt-1 text-xs leading-5 text-[#8a90a0]">Share this link so others can follow along.</p></div></div>
                  <label htmlFor="share-link" className="mt-5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9ba1ae]">Viewer link</label>
                  <input id="share-link" readOnly value={shareUrl} onFocus={(event) => event.currentTarget.select()} className="mt-2 h-10 w-full rounded-xl border border-[#e8eaf1] bg-[#f8f9fc] px-3 font-mono text-xs text-[#555d6d] outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
                  <Button type="button" className="mt-3 h-10 w-full rounded-xl bg-indigo-600 text-white hover:bg-indigo-700" onClick={copyShareLink} disabled={!shareUrl}>{copyStatus === 'Link copied' ? <Check /> : <Copy />} {copyStatus === 'Link copied' ? 'Link copied' : 'Copy viewer link'}</Button>
                  {copyStatus && <p role="status" className="mt-2 text-xs text-[#6b7280]">{copyStatus}</p>}
                  {shareUrl && ['localhost', '127.0.0.1', '[::1]'].includes(new URL(shareUrl).hostname) && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">This localhost link only works on this computer. Use a publicly hosted address to share it.</p>}
                </div>

                <div className="rounded-2xl border border-[#e5e7ef] bg-white p-5 shadow-[0_8px_30px_rgba(30,35,65,0.04)]">
                  <div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-[#252a39]">Session details</h2><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-[#f2f3f6] text-[#777e8e]'}`}>{isActive ? 'Active' : 'Expired'}</span></div>
                  <div className="mt-4 flex items-start gap-3 border-t border-[#f0f1f5] pt-4"><Clock3 className="mt-0.5 size-4 shrink-0 text-[#a0a6b3]" /><div><p className="text-xs font-medium text-[#9ba1ae]">Link expires</p><p className="mt-1 text-sm font-semibold text-[#4b5262]">{new Date(presentation.expiresAt).toLocaleString()}</p></div></div>
                  <Button className="mt-5 h-10 w-full rounded-xl border-[#e5e7ef] bg-white text-[#4d5565] hover:bg-[#f7f8fb]" variant="outline" onClick={handleDownloadPdf} disabled={downloading}><Download /> {downloading ? 'Preparing download…' : 'Download presentation'}</Button>
                </div>

                <button type="button" onClick={() => setShowShortcuts(true)} className="flex items-center gap-3 rounded-2xl border border-[#e5e7ef] bg-white p-4 text-left transition-colors hover:bg-[#fdfdff] sm:col-span-2 xl:col-span-1">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#f2f3f8] text-[#707789]"><Keyboard className="size-4" /></span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-[#4b5262]">Keyboard shortcuts</span><span className="mt-0.5 block text-xs text-[#9ba1ae]">Present with fewer clicks</span></span><ArrowUpRight className="size-4 text-[#a8adba]" />
                </button>
              </aside>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen w-full flex flex-col bg-[#0a0a0c]">
          <header className="fixed left-0 right-0 top-0 z-20 flex items-center justify-between p-4 sm:p-6 pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/10 bg-black/40 px-4 py-2 backdrop-blur-md">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">{isPresenter ? 'Presentation mode' : 'Viewer mode'}</span>
              <span className="h-3 w-px bg-white/20" />
              <span className="max-w-40 truncate text-xs font-medium text-white/70">{presentation.title}</span>
              {isPresenter && <span className="hidden items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 sm:inline-flex"><Users className="size-3.5" /> {viewerCount} viewing</span>}
            </div>
            <div className="pointer-events-auto flex items-center gap-2">
              {isPresenter && <Button variant="ghost" size="sm" className="rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/15 hover:text-white" onClick={() => setShowQrCode((visible) => !visible)}>{showQrCode ? <X /> : <QrCode />} {showQrCode ? 'Hide QR' : 'Show QR'}</Button>}
              <Button variant="ghost" size="sm" className="rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/15 hover:text-white" onClick={copyShareLink} disabled={!shareUrl}><Copy /> {copyStatus === 'Link copied' ? 'Copied' : 'Copy link'}</Button>
              <Button variant="ghost" size="sm" className="rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/15 hover:text-white" onClick={togglePresentationMode}>
                {isPresentationMode ? <Minimize2 /> : <Maximize2 />} {isPresentationMode ? 'Exit fullscreen' : 'Fullscreen'}
              </Button>
              <Button variant="ghost" size="icon" aria-label="Exit" className="rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/15 hover:text-white" onClick={() => router.push('/')}><LogOut /></Button>
              <Button variant="ghost" size="icon" aria-label="Keyboard shortcuts" className="rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/15 hover:text-white" onClick={() => setShowShortcuts(true)}><CircleHelp /></Button>
            </div>
          </header>
          {copyStatus && <p role="status" className="fixed right-4 top-20 z-20 rounded-lg bg-black/80 px-3 py-2 text-xs text-white">{copyStatus}</p>}

          <main className="flex-1 flex items-center justify-center p-4 pt-20 pb-24 sm:p-12">
            <div className="relative w-full max-w-[1400px] aspect-video overflow-hidden rounded-lg bg-black shadow-2xl shadow-black/60 ring-1 ring-white/10">
              {slide && <AnnotationCanvas slideImage={slide} presenterAnnotations={presenterAnnotations[currentSlide]} isPresenter={false} onAnnotationSave={handleAnnotationSave} />}
            </div>
          </main>

          <div className="fixed bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-white/10 bg-[#1c1f26]/90 p-2 shadow-2xl backdrop-blur-xl">
            <Button variant="ghost" size="icon" aria-label="Previous slide" className="rounded-xl text-white hover:bg-white/15 hover:text-white" onClick={handlePrevSlide} disabled={currentSlide === 0 || !canNavigate}><ChevronLeft /></Button>
            <div className="min-w-20 px-3 text-center"><span className="block text-[10px] font-bold uppercase tracking-widest text-white/40">Slide</span><span className="font-mono text-base font-semibold tabular-nums"><span className="text-indigo-400">{String(currentSlide + 1).padStart(2, '0')}</span><span className="mx-1 text-white/25">/</span><span className="text-white/50">{String(totalSlides).padStart(2, '0')}</span></span></div>
            <Button variant="ghost" size="icon" aria-label="Next slide" className="rounded-xl text-white hover:bg-white/15 hover:text-white" onClick={handleNextSlide} disabled={currentSlide === totalSlides - 1 || !canNavigate}><ChevronRight /></Button>
            <span className="mx-1 h-8 w-px bg-white/10" />
            <Button variant="ghost" size="icon" aria-label="Download presentation" className="rounded-xl text-white hover:bg-white/15 hover:text-white" onClick={handleDownloadPdf} disabled={downloading}><Download /></Button>
          </div>
          {qrCode && (!isPresenter || showQrCode) && <div className="fixed bottom-24 right-4 z-20 w-32 rounded-2xl bg-white p-2.5 text-center shadow-2xl sm:bottom-8 sm:right-8 sm:w-40 sm:p-3">
            <img src={qrCode} alt="QR code linking to this presentation" className="mx-auto aspect-square w-full rounded-lg" />
            <p className="mt-1.5 text-[10px] font-semibold text-[#33394c] sm:text-xs">Scan to follow along</p>
          </div>}
          <p className="fixed bottom-4 left-6 hidden text-[10px] font-medium uppercase tracking-[0.2em] text-white/20 sm:block">Live synchronization active</p>
        </div>
      )}

      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" onClick={() => setShowShortcuts(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1c1f26] p-6 text-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <div><p className="text-xs font-bold uppercase tracking-widest text-indigo-300">Keyboard shortcuts</p><h2 className="mt-1 text-lg font-semibold">Control your presentation</h2></div>
              <Button variant="ghost" size="icon" aria-label="Close shortcuts" className="text-white hover:bg-white/10 hover:text-white" onClick={() => setShowShortcuts(false)}>×</Button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                ['→ / ↓ / Space', 'Next slide'],
                ['← / ↑ / Page Up', 'Previous slide'],
                ['Home / End', 'First / last slide'],
                ['P or F', 'Enter or exit presentation mode'],
                ['?', 'Show or hide shortcuts'],
                ['Esc', 'Exit fullscreen or close this panel'],
              ].map(([shortcut, action]) => (
                <div key={shortcut} className="flex items-center justify-between gap-4">
                  <kbd className="rounded-md border border-white/15 bg-white/10 px-2 py-1 font-mono text-xs text-indigo-200">{shortcut}</kbd>
                  <span className="text-right text-white/70">{action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
