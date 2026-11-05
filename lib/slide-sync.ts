// Send only the latest slide after navigation settles, with at most one request
// in flight so a slow earlier request cannot overwrite a newer one.
export function createSlideSync(
  send: (slide: number) => Promise<void>,
  onError: (error: unknown) => void,
  delayMs = 200,
) {
  let timer: ReturnType<typeof setTimeout> | undefined
  let pending: number | undefined
  let ready = false
  let inFlight = false
  let disposed = false

  const flush = async () => {
    if (disposed || inFlight || !ready || pending === undefined) return
    const slide = pending
    pending = undefined
    ready = false
    inFlight = true
    try {
      await send(slide)
    } catch (error) {
      if (!disposed) onError(error)
    } finally {
      inFlight = false
      if (!disposed && ready) void flush()
    }
  }

  return {
    schedule(slide: number) {
      if (disposed) return
      pending = slide
      ready = false
      clearTimeout(timer)
      timer = setTimeout(() => {
        ready = true
        void flush()
      }, delayMs)
    },
    dispose() {
      disposed = true
      clearTimeout(timer)
      pending = undefined
    },
  }
}
