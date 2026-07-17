import { toast } from 'sonner'

export { toast }
export const success = (message: string) => toast.success(message)
export const error = (message: string) => toast.error(message)
