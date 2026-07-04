import { cn } from '@/shared/lib/utils'

interface UserAvatarProps {
  name: string
  className?: string
  color?: 'milk' | 'chocolate' | 'amber' | 'olive' | 'rose'
}

const colorStyles = {
  milk: 'bg-milk text-chocolate',
  chocolate: 'bg-chocolate text-milk',
  amber: 'bg-amber text-chocolate',
  olive: 'bg-olive text-white',
  rose: 'bg-rose text-white',
}

export function UserAvatar({ name, className, color = 'milk' }: UserAvatarProps) {
  const initial = name ? name.charAt(0).toUpperCase() : '?'
  
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-bold shadow-sm',
        colorStyles[color],
        className
      )}
      title={name}
    >
      {initial}
    </div>
  )
}
