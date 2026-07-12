'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Download, LogOut } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'

// Set up PDF.js worker - use local file from public directory
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
}

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
}: {
  presentation: Presentation
  isActive: boolean
  shareId: string
}) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [totalSlides, setTotalSlides] = useState(0)
  const [slides, setSlides] = useState<string[]>([])
  const [isPresenter, setIsPresenter] = useState(false)
  const [loading, setLoading] = useState(true)
  const [presenterAnnotations, setPresenterAnnotations] = useState<Record<number, any>>({})
  const [currentAnnotationData, setCurrentAnnotationData] = useState<any>(null)
  const [downloading, setDownloading] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const router = useRouter()

  // Load PDF slides
  useEffect(() => {
    const loadPdf = async () => {
      try {
        const pdf = await pdfjsLib.getDocument(presentation.blobUrl).promise
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

    const eventSource = new EventSource(`/api/presentations/${shareId}/subscribe`)

    eventSource.addEventListener('slide-change', (event) => {
      const data = JSON.parse(event.data)
      setCurrentSlide(data.slideIndex)
    })

    eventSource.addEventListener('annotation-update', (event) => {
      const data = JSON.parse(event.data)
      setPresenterAnnotations((prev) => ({
        ...prev,
        [data.slideIndex]: data.annotationData,
      }))
    })

    eventSource.addEventListener('presenter-joined', (event) => {
      const data = JSON.parse(event.data)
      setIsPresenter(data.isPresenter)
    })

    eventSource.onerror = () => {
      eventSource.close()
    }

    eventSourceRef.current = eventSource

    // Notify server that a client connected
    fetch(`/api/presentations/${shareId}/client-joined`, { method: 'POST' })

    return () => {
      eventSource.close()
    }
  }, [shareId, isActive])

  // Handle slide navigation
  const handlePrevSlide = () => {
    if (currentSlide > 0) {
      const newSlide = currentSlide - 1
      setCurrentSlide(newSlide)
      if (isPresenter && isActive) {
        fetch(`/api/presentations/${shareId}/slide-change`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slideIndex: newSlide }),
        })
      }
    }
  }

  const handleNextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      const newSlide = currentSlide + 1
      setCurrentSlide(newSlide)
      if (isPresenter && isActive) {
        fetch(`/api/presentations/${shareId}/slide-change`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slideIndex: newSlide }),
        })
      }
    }
  }

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
      a.download = `slide-${currentSlide + 1}.pdf`
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

  return (
    <main className="min-h-screen bg-background p-4">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{presentation.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isPresenter ? '👨‍🏫 Presenter Mode' : '👁️ Viewer Mode'} 
              {!isActive && ' (Expired - View Only)'}
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push('/')}>
            <LogOut className="w-4 h-4 mr-2" />
            Exit
          </Button>
        </div>

        {/* Main Viewer */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Slide Display */}
          <div className="lg:col-span-3">
            <Card className="overflow-hidden">
              <div className="relative bg-black aspect-video flex items-center justify-center">
                {slides[currentSlide] && (
                  <AnnotationCanvas
                    slideImage={slides[currentSlide]}
                    presenterAnnotations={presenterAnnotations[currentSlide]}
                    isPresenter={isPresenter && isActive}
                    onAnnotationSave={handleAnnotationSave}
                  />
                )}
              </div>

              {/* Controls */}
              <div className="p-4 bg-muted flex items-center justify-between">
                <Button
                  onClick={handlePrevSlide}
                  disabled={currentSlide === 0 || (!isPresenter && isActive)}
                  variant="outline"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    Slide {currentSlide + 1} of {totalSlides}
                  </p>
                </div>

                <Button
                  onClick={handleNextSlide}
                  disabled={currentSlide === totalSlides - 1 || (!isPresenter && isActive)}
                  variant="outline"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-4 sticky top-4">
              <h2 className="font-semibold text-foreground mb-4">Share Info</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Share ID</p>
                  <p className="font-mono text-xs bg-muted p-2 rounded mt-1 break-all">{shareId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className={`text-xs font-medium mt-1 ${isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {isActive ? '🟢 Active' : '🔴 Expired'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Expires</p>
                  <p className="text-xs mt-1">{new Date(presentation.expiresAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Download Button */}
              <Button 
                className="w-full mt-6" 
                size="sm"
                onClick={handleDownloadPdf}
                disabled={downloading}
              >
                <Download className="w-4 h-4 mr-2" />
                {downloading ? 'Downloading...' : 'Download PDF'}
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
