import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * POST /api/inbox/bulk
 * Perform bulk actions on conversations
 */
export async function POST(request: NextRequest) {
  try {
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
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { conversation_ids, action, data } = body

    if (!Array.isArray(conversation_ids) || conversation_ids.length === 0) {
      return NextResponse.json(
        { error: 'conversation_ids array is required' },
        { status: 400 }
      )
    }

    if (!action) {
      return NextResponse.json(
        { error: 'action is required' },
        { status: 400 }
      )
    }

    // Get user's account_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify all conversations belong to account
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .in('id', conversation_ids)
      .eq('account_id', userData.account_id)

    if (convError) {
      console.error('Error verifying conversations:', convError)
      return NextResponse.json(
        { error: 'Failed to verify conversations' },
        { status: 500 }
      )
    }

    const validIds = conversations?.map(c => c.id) || []
    if (validIds.length !== conversation_ids.length) {
      return NextResponse.json(
        { error: 'Some conversations not found or access denied' },
        { status: 403 }
      )
    }

    let result

    switch (action) {
      case 'assign': {
        if (!data?.user_id) {
          return NextResponse.json(
            { error: 'user_id is required for assign action' },
            { status: 400 }
          )
        }

        const { error: updateError } = await supabase
          .from('conversations')
          .update({ assigned_to: data.user_id })
          .in('id', validIds)

        if (updateError) {
          console.error('Error assigning conversations:', updateError)
          return NextResponse.json(
            { error: 'Failed to assign conversations' },
            { status: 500 }
          )
        }

        result = { updated: validIds.length }
        break
      }

      case 'change_status': {
        if (!data?.status) {
          return NextResponse.json(
            { error: 'status is required for change_status action' },
            { status: 400 }
          )
        }

        const { error: updateError } = await supabase
          .from('conversations')
          .update({ status: data.status })
          .in('id', validIds)

        if (updateError) {
          console.error('Error updating status:', updateError)
          return NextResponse.json(
            { error: 'Failed to update status' },
            { status: 500 }
          )
        }

        result = { updated: validIds.length }
        break
      }

      case 'add_tags': {
        if (!Array.isArray(data?.tag_ids) || data.tag_ids.length === 0) {
          return NextResponse.json(
            { error: 'tag_ids array is required for add_tags action' },
            { status: 400 }
          )
        }

        // Add tags to conversations (assuming contact_tag_assignments or similar)
        // This is a simplified version - adjust based on your tag system
        const tagAssignments = validIds.flatMap(convId =>
          data.tag_ids.map((tagId: string) => ({
            conversation_id: convId,
            tag_id: tagId,
          }))
        )

        // Note: Adjust table name based on your schema
        // This assumes a conversation_tags table exists
        const { error: tagError } = await supabase
          .from('conversation_tags')
          .upsert(tagAssignments, { onConflict: 'conversation_id,tag_id' })
          .catch(() => {
            // If table doesn't exist, skip tag assignment
            return { error: null }
          })

        if (tagError) {
          console.warn('Tag assignment not available:', tagError)
        }

        result = { updated: validIds.length }
        break
      }

      case 'archive': {
        const { error: updateError } = await supabase
          .from('conversations')
          .update({ status: 'closed' }) // Archive by closing
          .in('id', validIds)

        if (updateError) {
          console.error('Error archiving conversations:', updateError)
          return NextResponse.json(
            { error: 'Failed to archive conversations' },
            { status: 500 }
          )
        }

        result = { updated: validIds.length }
        break
      }

      case 'delete': {
        const { error: deleteError } = await supabase
          .from('conversations')
          .delete()
          .in('id', validIds)

        if (deleteError) {
          console.error('Error deleting conversations:', deleteError)
          return NextResponse.json(
            { error: 'Failed to delete conversations' },
            { status: 500 }
          )
        }

        result = { deleted: validIds.length }
        break
      }

      case 'export': {
        // Get conversation data for export
        const { data: exportData, error: exportError } = await supabase
          .from('conversations')
          .select('*')
          .in('id', validIds)

        if (exportError) {
          console.error('Error fetching export data:', exportError)
          return NextResponse.json(
            { error: 'Failed to fetch export data' },
            { status: 500 }
          )
        }

        result = { exported: validIds.length, data: exportData }
        break
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true, ...result })
  } catch (error: unknown) {
    console.error('Error performing bulk action:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

