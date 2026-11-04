'use client'

import { useFormStatus } from 'react-dom'

export default function BotaoEnviar({ children, ...props }) {
  const { pending } = useFormStatus()
  return (
    <button {...props} disabled={pending}>
      {pending ? '...' : children}
    </button>
  )
}
