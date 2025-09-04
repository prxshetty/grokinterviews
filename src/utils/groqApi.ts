import Groq from 'groq-sdk'

// Utility for round-robin Groq API-key rotation that works both locally and on Vercel.
// Usage: const apiKey = await getNextGroqApiKey(); const groq = new Groq({ apiKey })

/**
 * Environment variables expected:
 *   NUM_GROQ_API_KEYS – total number of configured keys
 *   GROQ_API_KEY_0..N  – the individual keys
 *   KV_REST_API_URL & KV_REST_API_TOKEN – only when using Vercel KV in production
 */

const apiKeys: string[] = []
const numApiKeys = parseInt(process.env.NUM_GROQ_API_KEYS || '0', 10)

for (let i = 0; i < numApiKeys; i++) {
  const key = process.env[`GROQ_API_KEY_${i}`]
  if (key) apiKeys.push(key)
  else console.warn(`groqApi: GROQ_API_KEY_${i} not set.`)
}

if (apiKeys.length === 0)
  console.error('[groqApi] No Groq API keys configured. Set GROQ_API_KEY_0.. and NUM_GROQ_API_KEYS.')

const KV_KEY_INDEX = 'groq_api_key_index_v1'
let kv: any = null
let kvReady = false
let localIndex = 0

async function initKV() {
  if (kvReady) return
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      kv = (await import('@vercel/kv')).kv
      console.log('[groqApi] Using Vercel KV for API-key rotation')
    } catch {
      console.log('[groqApi] @vercel/kv not available – falling back to in-memory rotation')
    }
  } else {
    console.log('[groqApi] KV env vars not set – falling back to in-memory rotation')
  }
  kvReady = true
}

export async function getNextGroqApiKey(): Promise<string | null> {
  if (apiKeys.length === 0) return null
  if (apiKeys.length === 1) return apiKeys[0] || null

  await initKV()

  try {
    if (kv) {
      // Persistent rotation across lambdas
      let idx = (await kv.get(KV_KEY_INDEX)) as number
      if (!Number.isInteger(idx) || idx < 0 || idx >= apiKeys.length) idx = 0
      const key = apiKeys[idx]
      await kv.set(KV_KEY_INDEX, (idx + 1) % apiKeys.length)
      return key || null
    }

    // Local fallback
    const key = apiKeys[localIndex]
    localIndex = (localIndex + 1) % apiKeys.length
    return key || null
  } catch (err) {
    console.error('[groqApi] Rotation error – returning first key', err)
    return apiKeys[0] || null
  }
}

// Convenience helper to create Groq client with the next key
export async function createRotatingGroq(): Promise<Groq | null> {
  const key = await getNextGroqApiKey()
  return key ? new Groq({ apiKey: key }) : null
}