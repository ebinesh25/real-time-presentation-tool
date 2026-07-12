'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Pen, Eraser, RotateCcw } from 'lucide-react'

interface AnnotationCanvasProps {
  slideImage: string
  presenterAnnotations?: any
  isPresenter: boolean
  onAnnotationSave: (data: any) => void
}

export function AnnotationCanvas({
  slideImage,
  presenterAnnotations,
  isPresenter,
  onAnnotationSave,
}: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null)
  const [mode, setMode] = useState<'draw' | 'erase'>('draw')
  const [presenterMode, setPresenterMode] = useState(false)

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to match container
    const rect = canvas.parentElement?.getBoundingClientRect()
    canvas.width = rect?.width || 800
    canvas.height = rect?.height || 600

    // Draw slide image
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      // Draw presenter annotations with blue color
      if (presenterAnnotations) {
        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        if (presenterAnnotations.paths) {
          presenterAnnotations.paths.forEach((path: any[]) => {
            ctx.beginPath()
            path.forEach((point, index) => {
              if (index === 0) {
                ctx.moveTo(point.x, point.y)
              } else {
                ctx.lineTo(point.x, point.y)
              }
            })
            ctx.stroke()
          })
        }
      }
    }
    img.src = slideImage

    setContext(ctx)
  }, [slideImage, presenterAnnotations])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPresenter) return
    if (!context) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDrawing(true)
    context.beginPath()
    context.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context || !isPresenter) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (mode === 'draw') {
      context.strokeStyle = '#3b82f6'
      context.lineWidth = 3
      context.lineCap = 'round'
      context.lineJoin = 'round'
      context.lineTo(x, y)
      context.stroke()
    } else if (mode === 'erase') {
      context.clearRect(x - 10, y - 10, 20, 20)
    }
  }

  const endDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)

    if (isPresenter && context) {
      const canvas = canvasRef.current
      if (canvas) {
        const imageData = canvas.toDataURL()
        onAnnotationSave({
          imageData,
          timestamp: new Date().toISOString(),
        })
      }
    }
  }

  const clearCanvas = () => {
    if (!context || !canvasRef.current) return

    const canvas = canvasRef.current
    context.clearRect(0, 0, canvas.width, canvas.height)

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      context.drawImage(img, 0, 0, canvas.width, canvas.height)
    }
    img.src = slideImage

    if (isPresenter) {
      onAnnotationSave({
        imageData: canvas.toDataURL(),
        timestamp: new Date().toISOString(),
      })
    }
  }

  return (
    <div className="w-full h-full flex flex-col">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
        className={`flex-1 ${isPresenter ? 'cursor-crosshair' : 'cursor-default'}`}
      />

      {isPresenter && (
        <div className="flex gap-2 p-3 bg-muted border-t">
          <Button
            size="sm"
            variant={mode === 'draw' ? 'default' : 'outline'}
            onClick={() => setMode('draw')}
          >
            <Pen className="w-4 h-4 mr-1" />
            Draw
          </Button>
          <Button
            size="sm"
            variant={mode === 'erase' ? 'default' : 'outline'}
            onClick={() => setMode('erase')}
          >
            <Eraser className="w-4 h-4 mr-1" />
            Erase
          </Button>
          <Button size="sm" variant="outline" onClick={clearCanvas}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>
      )}
    </div>
  )
}
