'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, Loader2 } from 'lucide-react'

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [expiryHours, setExpiryHours] = useState(4)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.pptx') && !selectedFile.name.endsWith('.ppt')) {
        setError('Please upload a valid PowerPoint file (.ppt or .pptx)')
        setFile(null)
        return
      }
      setError(null)
      setFile(selectedFile)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a file')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('expiryHours', expiryHours.toString())
      formData.append('title', file.name.replace(/\.[^/.]+$/, ''))

      const response = await fetch('/api/presentations/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Upload failed')
      }

      const data = await response.json()
      router.push(`/present/${data.shareId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during upload')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle>Upload Presentation</CardTitle>
        <CardDescription>Share your PowerPoint with others and control the slides in real-time</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Select PowerPoint File</label>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".ppt,.pptx"
                onChange={handleFileChange}
                disabled={loading}
                className="cursor-pointer"
              />
              {file && <span className="text-sm text-muted-foreground">{file.name}</span>}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="expiry" className="block text-sm font-medium text-foreground">
              Share Link Expiry (hours)
            </label>
            <Input
              id="expiry"
              type="number"
              min="1"
              max="24"
              value={expiryHours}
              onChange={(e) => setExpiryHours(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              After expiry, the link becomes view-only (no live updates)
            </p>
          </div>

          {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">{error}</div>}

          <Button type="submit" disabled={loading || !file} className="w-full" size="lg">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload & Generate Link
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
