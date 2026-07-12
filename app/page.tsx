import { UploadForm } from '@/components/upload-form'

export const metadata = {
  title: 'Presentation Share',
  description: 'Upload and share your presentations with real-time collaboration',
}

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-2 text-foreground">Presentation Share</h1>
          <p className="text-center text-muted-foreground mb-8">
            Upload your PowerPoint presentation and share it with others in real-time
          </p>
          <UploadForm />
        </div>
      </div>
    </main>
  )
}
