import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const allowedRevertFields: Record<string, readonly string[]> = {
  job: ['title', 'description', 'status', 'scheduled_at', 'assigned_to'],
  contact: ['first_name', 'last_name', 'email', 'phone', 'address', 'status', 'tags'],
  user: ['full_name', 'role', 'status'],
  conversation: ['status', 'assigned_to', 'subject'],
  message: ['status', 'read_at'],
  account: ['name', 'inbound_email_domain', 'settings'],
}

/**
 * POST /api/audit/[id]/revert
 * Revert a change from audit log
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    void request
    const auth = await getAuthenticatedSession()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              for (const { name, value, options } of cookiesToSet) {
                cookieStore.set(name, value, options)
              }
            } catch {}
          },
        },
      }
    )

    // Check if user is admin
    const { data: currentUser } = await supabase
      .from('users')
      .select('role, account_id')
      .eq('id', auth.user.id)
      .single()

    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'owner' && currentUser.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: auditId } = await params

    // Fetch audit log entry
    const { data: auditLog, error: fetchError } = await supabase
      .from('crmai_audit')
      .select('*')
      .eq('id', auditId)
      .single()

    if (fetchError || !auditLog) {
      return NextResponse.json({ error: 'Audit log not found' }, { status: 404 })
    }

    // Check account access (super_admin can access all)
    if (currentUser.role !== 'super_admin' && auditLog.account_id !== currentUser.account_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if old_values exist
    if (!auditLog.old_values || Object.keys(auditLog.old_values).length === 0) {
      return NextResponse.json(
        { error: 'Cannot revert: no previous state available' },
        { status: 400 }
      )
    }

    // Determine which table to update based on entity_type
    const entityType = auditLog.entity_type
    const entityId = auditLog.entity_id

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'Cannot revert: missing entity information' },
        { status: 400 }
      )
    }

    // Map entity types to table names
    const tableMap: Record<string, string> = {
      'job': 'jobs',
      'contact': 'contacts',
      'user': 'users',
      'conversation': 'conversations',
      'message': 'messages',
      'account': 'accounts',
    }

    const tableName = tableMap[entityType]
    if (!tableName) {
      return NextResponse.json(
        { error: `Cannot revert: unsupported entity type ${entityType}` },
        { status: 400 }
      )
    }

    const oldValues = auditLog.old_values
    if (!oldValues || typeof oldValues !== 'object' || Array.isArray(oldValues)) {
      return NextResponse.json({ error: 'Cannot revert: invalid previous state' }, { status: 400 })
    }
    const allowedFields = allowedRevertFields[entityType]
    const safeOldValues = Object.fromEntries(
      Object.entries(oldValues as Record<string, unknown>).filter(([field]) => allowedFields.includes(field))
    )
    if (Object.keys(safeOldValues).length === 0) {
      return NextResponse.json({ error: 'Cannot revert: no allowed fields in previous state' }, { status: 400 })
    }

    // Revert only allowlisted fields on the exact audited account/entity.
    let updateQuery = supabase
      .from(tableName)
      .update(safeOldValues)
      .eq('id', entityId)
    if (tableName !== 'accounts') updateQuery = updateQuery.eq('account_id', auditLog.account_id)
    const { error: updateError } = await updateQuery

    if (updateError) {
      console.error('Error reverting change:', updateError)
      return NextResponse.json(
        { error: `Failed to revert: ${updateError.message}` },
        { status: 500 }
      )
    }

    // Log the revert action
    await supabase.from('crmai_audit').insert({
      account_id: auditLog.account_id,
      user_id: auth.user.id,
      action: 'revert',
      entity_type: entityType,
      entity_id: entityId,
      old_values: auditLog.new_values,
      new_values: auditLog.old_values,
      metadata: {
        reverted_from: auditId,
        original_action: auditLog.action,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Change reverted successfully',
    })
  } catch (error: unknown) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
