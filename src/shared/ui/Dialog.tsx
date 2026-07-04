import React from 'react'
import { cn } from '@/shared/lib/utils'

// ─── Dialog ───────────────────────────────────────────────────────────────────

interface DialogProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export function Dialog({ open, onClose, children, className }: DialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-chocolate/30 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Content */}
      <div
        className={cn(
          'relative w-full bg-beige shadow-card-lg border border-cream overflow-hidden',
          'rounded-t-[32px] sm:rounded-3xl',
          'max-h-[90vh] sm:max-h-none overflow-y-auto',
          'sm:max-w-md',
          'animate-slide-up sm:animate-scale-in',
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-warm-gray/20" />
        </div>
        {children}
      </div>
    </div>
  )
}

export function DialogHeader({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('px-6 pt-2 sm:pt-6 pb-4 border-b border-cream', className)}>
      {children}
    </div>
  )
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-semibold text-chocolate">{children}</h2>
  )
}

export function DialogDescription({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-warm-gray mt-1">{children}</p>
  )
}

export function DialogBody({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn('px-6 py-4', className)}>{children}</div>
}

export function DialogFooter({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'px-6 pb-6 pt-4 border-t border-cream flex gap-3 justify-end pb-safe',
        className
      )}
    >
      {children}
    </div>
  )
}
