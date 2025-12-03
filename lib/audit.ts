import { createClient } from '@supabase/supabase-js'

interface AuditLogParams {
  accountId?: string
  userId?: string
  action: string
  entityType: string
  entityId?: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  gpsLatitude?: number
  gpsLongitude?: number
  metadata?: Record<string, any>
}

export async function logAudit(
  supabaseUrl: string,
  serviceRoleKey: string,
  params: AuditLogParams
) {
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const { error } = await supabase.from('crmai_audit').insert({
    account_id: params.accountId,
    user_id: params.userId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId,
    old_values: params.oldValues,
    new_values: params.newValues,
    ip_address: params.ipAddress,
    user_agent: params.userAgent,
    gps_latitude: params.gpsLatitude,
    gps_longitude: params.gpsLongitude,
    metadata: params.metadata || {},
  })

  if (error) {
    console.error('Audit log error:', error)
    // Don't throw - audit failures shouldn't break the app
  }
}

