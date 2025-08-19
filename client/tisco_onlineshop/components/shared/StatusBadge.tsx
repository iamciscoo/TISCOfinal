import React from 'react'
import { Badge } from '@/components/ui/badge'
import { getStatusBadgeVariant } from '@/lib/shared-utils'

interface StatusBadgeProps {
  status: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = '',
  size = 'md'
}) => {
  const variant = getStatusBadgeVariant(status)
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1.5',
    lg: 'text-base px-3 py-2'
  }

  const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')

  return (
    <Badge 
      variant={variant} 
      className={`${sizeClasses[size]} ${className}`}
    >
      {capitalizedStatus}
    </Badge>
  )
}
