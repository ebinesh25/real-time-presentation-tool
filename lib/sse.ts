// In-memory store for SSE connections
// In a production app, this would be Redis or similar
type Client = { send: (data: string) => void; isPresenter: boolean }
const clients: Record<string, Record<string, Client>> = {}

function broadcastViewerCount(shareId: string) {
  const viewerCount = getViewerCount(shareId)
  broadcastToClients(shareId, 'viewer-count', { viewerCount })
}

export function getViewerCount(shareId: string) {
  return Object.values(clients[shareId] ?? {}).filter((client) => !client.isPresenter).length
}

export function registerClient(
  shareId: string,
  clientId: string,
  sendFn: (data: string) => void,
  isPresenter = false
) {
  if (!clients[shareId]) {
    clients[shareId] = {}
  }
  clients[shareId][clientId] = { send: sendFn, isPresenter }

  console.log(
    `[v0] Client ${clientId} joined ${shareId}. Total clients: ${
      Object.keys(clients[shareId]).length
    }`
  )
  broadcastViewerCount(shareId)
}
export function unregisterClient(shareId: string, clientId: string) {
  if (clients[shareId]) {
    delete clients[shareId][clientId]

    broadcastViewerCount(shareId)

    if (Object.keys(clients[shareId]).length === 0) {
      delete clients[shareId]
    }

    console.log(`[v0] Client ${clientId} left ${shareId}`)
  }
}

export function broadcastToClients(shareId: string, eventType: string, data: any) {
  if (!clients[shareId]) return

  const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`

  Object.values(clients[shareId]).forEach(({ send: sendFn }) => {
    try {
      sendFn(message)
    } catch (error) {
      console.error('[v0] Error broadcasting message:', error)
    }
  })

  console.log(`[v0] Broadcasted ${eventType} to ${Object.keys(clients[shareId]).length} clients`)
}
