import { test } from 'node:test'
import assert from 'node:assert/strict'
import { setTimeout as wait } from 'node:timers/promises'
import { createSlideSync } from '../lib/slide-sync.ts'

test('rapid slide changes send the latest slide', async () => {
  const sent = []
  const sync = createSlideSync(async (slide) => { sent.push(slide) }, assert.fail, 20)
  sync.schedule(1)
  sync.schedule(2)
  sync.schedule(5)
  await wait(60)
  assert.deepEqual(sent, [5])
  sync.dispose()
})

test('a slow request completes before the latest pending slide is sent', async () => {
  const sent = []
  let release
  const first = new Promise((resolve) => { release = resolve })
  const sync = createSlideSync(async (slide) => {
    sent.push(slide)
    if (slide === 1) await first
  }, assert.fail, 20)
  sync.schedule(1)
  await wait(50)
  sync.schedule(2)
  sync.schedule(4)
  await wait(50)
  assert.deepEqual(sent, [1])
  release()
  await wait(20)
  assert.deepEqual(sent, [1, 4])
  sync.dispose()
})

test('disposing cancels a pending slide update', async () => {
  const sent = []
  const sync = createSlideSync(async (slide) => { sent.push(slide) }, assert.fail, 20)
  sync.schedule(3)
  sync.dispose()
  await wait(50)
  assert.deepEqual(sent, [])
})
