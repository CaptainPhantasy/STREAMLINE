'use client'

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { Briefcase, User, FileText, Edit, Trash2, Copy } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface JobContextMenuProps {
  jobId: string
  children: React.ReactNode
  onAssignTech?: () => void
  onUpdateStatus?: () => void
  onCreateInvoice?: () => void
  onViewDetails?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function JobContextMenu({
  jobId,
  children,
  onAssignTech,
  onUpdateStatus,
  onCreateInvoice,
  onViewDetails,
  onEdit,
  onDelete,
}: JobContextMenuProps) {
  const router = useRouter()

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {onViewDetails && (
          <ContextMenuItem onClick={onViewDetails}>
            <Briefcase className="w-4 h-4 mr-2" />
            View Details
          </ContextMenuItem>
        )}
        {onEdit && (
          <ContextMenuItem onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Job
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        {onAssignTech && (
          <ContextMenuItem onClick={onAssignTech}>
            <User className="w-4 h-4 mr-2" />
            Assign Technician
          </ContextMenuItem>
        )}
        {onUpdateStatus && (
          <ContextMenuItem onClick={onUpdateStatus}>
            <Briefcase className="w-4 h-4 mr-2" />
            Update Status
          </ContextMenuItem>
        )}
        {onCreateInvoice && (
          <ContextMenuItem onClick={onCreateInvoice}>
            <FileText className="w-4 h-4 mr-2" />
            Create Invoice
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => {
            navigator.clipboard.writeText(jobId)
          }}
        >
          <Copy className="w-4 h-4 mr-2" />
          Copy Job ID
        </ContextMenuItem>
        {onDelete && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={onDelete}
              variant="destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Job
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}

