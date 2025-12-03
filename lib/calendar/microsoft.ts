import { Client } from '@microsoft/microsoft-graph-client'
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials'
import { ClientSecretCredential } from '@azure/identity'

export interface MicrosoftCalendarEvent {
  subject: string
  body?: {
    contentType: 'text' | 'html'
    content: string
  }
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  location?: {
    displayName: string
  }
  attendees?: Array<{
    emailAddress: {
      address: string
      name?: string
    }
    type: 'required' | 'optional'
  }>
  reminderMinutesBeforeStart?: number
}

export async function createMicrosoftCalendarEvent(
  accessToken: string,
  event: MicrosoftCalendarEvent
): Promise<{ id: string; webLink?: string }> {
  const client = Client.init({
    authProvider: (done) => {
      done(null, accessToken)
    },
  })

  const response = await client
    .api('/me/calendar/events')
    .post({
      ...event,
      start: {
        ...event.start,
        timeZone: event.start.timeZone || 'America/Indiana/Indianapolis',
      },
      end: {
        ...event.end,
        timeZone: event.end.timeZone || 'America/Indiana/Indianapolis',
      },
    })

  return {
    id: response.id,
    webLink: response.webLink,
  }
}

export async function listMicrosoftCalendarEvents(
  accessToken: string,
  startDateTime?: string,
  endDateTime?: string
): Promise<MicrosoftCalendarEvent[]> {
  const client = Client.init({
    authProvider: (done) => {
      done(null, accessToken)
    },
  })

  const filter = startDateTime
    ? `start/dateTime ge '${startDateTime}'`
    : undefined

  const response = await client
    .api('/me/calendar/events')
    .filter(filter)
    .select('id,subject,body,start,end,location,attendees')
    .get()

  return (response.value || []).map((item: any) => ({
    subject: item.subject,
    body: item.body
      ? {
          contentType: item.body.contentType === 'html' ? 'html' : 'text',
          content: item.body.content,
        }
      : undefined,
    start: {
      dateTime: item.start.dateTime,
      timeZone: item.start.timeZone,
    },
    end: {
      dateTime: item.end.dateTime,
      timeZone: item.end.timeZone,
    },
    location: item.location
      ? {
          displayName: item.location.displayName,
        }
      : undefined,
  }))
}

export async function updateMicrosoftCalendarEvent(
  accessToken: string,
  eventId: string,
  event: Partial<MicrosoftCalendarEvent>
): Promise<void> {
  const client = Client.init({
    authProvider: (done) => {
      done(null, accessToken)
    },
  })

  await client.api(`/me/calendar/events/${eventId}`).patch(event)
}

export async function deleteMicrosoftCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<void> {
  const client = Client.init({
    authProvider: (done) => {
      done(null, accessToken)
    },
  })

  await client.api(`/me/calendar/events/${eventId}`).delete()
}

export async function refreshMicrosoftAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; expiryDate: Date }> {
  // Microsoft token refresh logic
  // This would use MSAL or similar
  // For now, return a placeholder
  throw new Error('Microsoft token refresh not yet implemented')
}

