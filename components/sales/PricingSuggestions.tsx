'use client'

/**
 * PricingSuggestions - AI-recommended pricing ranges
 *
 * Shows low, recommended, and high pricing with profit margins.
 *
 * @example
 * ```tsx
 * <PricingSuggestions
 *   suggestions={pricingSuggestions}
 *   onSelect={(suggestion) => console.log('Selected:', suggestion)}
 * />
 * ```
 */

import { cn } from '@/lib/utils'
import { DollarSign, TrendingUp, AlertCircle } from 'lucide-react'
import type { PricingSuggestionsProps } from '@/lib/types/sales'

export function PricingSuggestions({ suggestions, onSelect, className }: PricingSuggestionsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercent = (value: number) => {
    return `${Math.round(value * 100)}%`
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2 text-green-400">
        <DollarSign className="w-5 h-5" />
        <h3 className="font-bold text-white">AI Pricing Suggestions</h3>
      </div>

      {suggestions.length === 0 ? (
        <div className="bg-gray-800/50 rounded-xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">No pricing suggestions available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => onSelect?.(suggestion)}
              className="bg-gray-800/50 rounded-xl p-4 hover:bg-gray-700/50 transition-colors cursor-pointer"
            >
              {/* Service Name */}
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-white text-lg">{suggestion.service}</h4>
                {suggestion.profit_margin && (
                  <div className="flex items-center gap-1 text-green-400">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-semibold">
                      {formatPercent(suggestion.profit_margin)} margin
                    </span>
                  </div>
                )}
              </div>

              {/* Pricing Range */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                {/* Low */}
                <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-400 mb-1">Low</div>
                  <div className="text-lg font-bold text-gray-300">
                    {formatCurrency(suggestion.low)}
                  </div>
                </div>

                {/* Recommended */}
                <div className="bg-green-900/30 border-2 border-green-500/50 rounded-lg p-3 text-center">
                  <div className="text-xs text-green-400 font-semibold mb-1">Recommended</div>
                  <div className="text-xl font-bold text-green-400">
                    {formatCurrency(suggestion.recommended)}
                  </div>
                </div>

                {/* High */}
                <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-400 mb-1">High</div>
                  <div className="text-lg font-bold text-gray-300">
                    {formatCurrency(suggestion.high)}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {suggestion.notes && (
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-300">{suggestion.notes}</p>
                  </div>
                </div>
              )}

              {/* Visual Range Indicator */}
              <div className="mt-3">
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden relative">
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-500 via-green-500 to-blue-500"
                    style={{
                      width: '100%',
                    }}
                  />
                  <div
                    className="absolute top-0 h-full w-1 bg-white shadow-lg"
                    style={{
                      left: `${
                        ((suggestion.recommended - suggestion.low) /
                          (suggestion.high - suggestion.low)) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Conservative</span>
                  <span>Aggressive</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Overall Strategy Tip */}
      {suggestions.length > 0 && (
        <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl p-4">
          <h4 className="font-semibold text-purple-400 mb-2">💡 Pricing Strategy</h4>
          <p className="text-sm text-gray-300">
            Start with the recommended price. If the customer hesitates, you have room to negotiate
            down to the low price while maintaining profitability. The high price is for premium
            customers or rush jobs.
          </p>
        </div>
      )}
    </div>
  )
}

export default PricingSuggestions
