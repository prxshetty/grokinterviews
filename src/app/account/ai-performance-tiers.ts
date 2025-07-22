import { GroqModel } from './types'

export type PerformanceTier = 'fast' | 'balanced' | 'highQuality'

export interface PerformanceTierConfig {
  id: PerformanceTier
  name: string
  description: string
  speed: number // 1-5
  quality: number // 1-5
  bestFor: string
  modelId: GroqModel['id']
}

export const PERFORMANCE_TIERS: PerformanceTierConfig[] = [
  {
    id: 'fast',
    name: 'Fast',
    description: 'Lightning-fast responses for quick interactions',
    speed: 5,
    quality: 3,
    bestFor: 'Quick answers & simple queries',
    modelId: 'llama-3.1-8b-instant'
  },
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Great mix of speed and quality',
    speed: 3,
    quality: 4,
    bestFor: 'Code, math & general use',
    modelId: 'gemma2-9b-it'
  },
  {
    id: 'highQuality',
    name: 'High Quality',
    description: 'Most capable model for complex tasks',
    speed: 2,
    quality: 5,
    bestFor: 'Detailed analysis & complex queries',
    modelId: 'llama-3.3-70b-versatile'
  }
]

export function getTierByModelId(modelId: string): PerformanceTier | undefined {
  return PERFORMANCE_TIERS.find(tier => tier.modelId === modelId)?.id
}

export function getModelIdByTier(tier: PerformanceTier): string | undefined {
  return PERFORMANCE_TIERS.find(t => t.id === tier)?.modelId
}
