// In-memory store for SSE connections
// In a production app, this would be Redis or similar
const clients: Record<string, Record<string, (data: string) => void>> = {}
const presenterStatus: Record<string, boolean> = {}

export function registerClient(
  shareId: string,
  clientId: string,
  sendFn: (data: string) => void
) {
  if (!clients[shareId]) {
    clients[shareId] = {}
  }
  clients[shareId][clientId] = sendFn

  // Determine if this is the presenter
  const isPresenter = Object.keys(clients[shareId]).length === 1 && !presenterStatus[shareId]
  presenterStatus[shareId] = isPresenter

  // Notify this client of presenter status
  sendFn(`event: presenter-joined\ndata: ${JSON.stringify({ isPresenter })}\n\n`)

  console.log(
    `[v0] Client ${clientId} joined ${shareId}. Presenter: ${isPresenter}, Total clients: ${
      Object.keys(clients[shareId]).length
    }`
  )
}

export function unregisterClient(shareId: string, clientId: string) {
  if (clients[shareId]) {
    delete clients[shareId][clientId]

    if (Object.keys(clients[shareId]).length === 0) {
      delete clients[shareId]
      delete presenterStatus[shareId]
    }

    console.log(`[v0] Client ${clientId} left ${shareId}`)
  }
}

export function broadcastToClients(shareId: string, eventType: string, data: any) {
  if (!clients[shareId]) return

  const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`

  Object.values(clients[shareId]).forEach((sendFn) => {
    try {
      sendFn(message)
    } catch (error) {
      console.error('[v0] Error broadcasting message:', error)
    }
  })

  console.log(`[v0] Broadcasted ${eventType} to ${Object.keys(clients[shareId]).length} clients`)
}

export function setPresenterStatus(shareId: string, isPresenter: boolean) {
  presenterStatus[shareId] = isPresenter
}

export function getPresenterStatus(shareId: string): boolean {
  return presenterStatus[shareId] || false
}
