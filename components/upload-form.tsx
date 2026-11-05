'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, FileUp, Loader2, Presentation } from 'lucide-react'

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [expiryHours, setExpiryHours] = useState(4)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) {
      setFile(null)
      return
    }
    if (!/\.(ppt|pptx)$/i.test(selectedFile.name)) {
      setError('Please choose a PowerPoint file (.ppt or .pptx).')
      setFile(null)
      event.target.value = ''
      return
    }
    setError(null)
    setFile(selectedFile)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!file) {
      setError('Please choose a PowerPoint file.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('expiryHours', expiryHours.toString())
      formData.append('title', file.name.replace(/\.[^/.]+$/, ''))

      const response = await fetch('/api/presentations/upload', { method: 'POST', body: formData })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Upload failed')
      }
      const data = await response.json()
      if (typeof data.shareId !== 'string' || !data.shareId) throw new Error('The presentation could not be opened. Please try again.')
      router.push(`/present/${encodeURIComponent(data.shareId)}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during upload')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-[24px] border border-[#e9ebf3] bg-white p-6 shadow-[0_18px_60px_rgba(35,40,78,0.07)] sm:p-8">
      <div className="flex items-start gap-3.5"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Presentation className="size-5" /></span><div><h3 className="text-lg font-semibold tracking-tight text-[#252a3a]">Create a presentation</h3><p className="mt-1 text-sm leading-6 text-[#9499a8]">Start by choosing your PowerPoint file.</p></div></div>
      <form onSubmit={handleSubmit} className="mt-7 space-y-6">
        <div>
          <label htmlFor="presentation-file" className="mb-2.5 block text-xs font-semibold text-[#545b6b]">Presentation file</label>
          <input id="presentation-file" type="file" accept=".ppt,.pptx" onChange={handleFileChange} disabled={loading} aria-describedby="presentation-file-hint" className="peer sr-only" />
          <label htmlFor="presentation-file" className="flex min-h-[154px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#cdd1e1] bg-[#fafbfe] px-4 py-5 text-center transition-colors hover:border-indigo-400 hover:bg-indigo-50/40 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-indigo-600 peer-disabled:cursor-not-allowed peer-disabled:opacity-60">
            <span className={`flex size-11 items-center justify-center rounded-xl ${file ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>{file ? <Check className="size-5" /> : <FileUp className="size-5" />}</span>
            <span className="mt-3 max-w-full truncate text-sm font-semibold text-[#343a4b]">{file ? file.name : 'Choose a PowerPoint file'}</span>
            <span className="mt-1 text-xs text-[#a0a5b2]">{file ? 'Click to choose a different file' : 'Select a file from your device'}</span>
          </label>
          <p id="presentation-file-hint" className="mt-2 text-xs text-[#9ba1af]">Supported formats: .ppt and .pptx</p>
        </div>

        <div>
          <div className="flex items-center justify-between gap-4"><label htmlFor="expiry" className="text-xs font-semibold text-[#545b6b]">Session duration</label><span className="text-xs text-[#a0a6b3]">1–24 hours</span></div>
          <div className="relative mt-2.5"><input id="expiry" type="number" min="1" max="24" value={expiryHours} onChange={(event) => setExpiryHours(Math.min(24, Math.max(1, parseInt(event.target.value, 10) || 1)))} disabled={loading} aria-describedby="expiry-hint" className="h-11 w-full rounded-xl border border-[#e7e9f1] bg-white px-3.5 pr-16 text-sm font-medium text-[#343a4b] outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60" /><span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#9ba1af]">hours</span></div>
          <p id="expiry-hint" className="mt-2 text-xs leading-5 text-[#9ba1af]">After this, viewers can still view and download without live updates.</p>
        </div>

        {error && <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <button type="submit" disabled={loading || !file} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? <><Loader2 className="size-4 animate-spin" /> Creating your presentation…</> : <>Create presentation <ArrowRight className="size-4" /></>}
        </button>
        <p className="text-center text-xs leading-5 text-[#a0a6b3]">You’ll get a viewer link after your upload is complete.</p>
      </form>
    </div>
  )
}
