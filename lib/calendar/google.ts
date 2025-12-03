import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

export interface GoogleCalendarEvent {
  id?: string
  summary: string
  description?: string
  start: {
    dateTime: string
    timeZone?: string
  }
  end: {
    dateTime: string
    timeZone?: string
  }
  location?: string
  attendees?: Array<{
    email: string
    displayName?: string
  }>
  reminders?: {
    useDefault?: boolean
    overrides?: Array<{
      method: 'email' | 'popup'
      minutes: number
    }>
  }
}

export async function createGoogleCalendarEvent(
  accessToken: string,
  event: GoogleCalendarEvent
): Promise<{ id: string; htmlLink?: string }> {
  const auth = new OAuth2Client()
  auth.setCredentials({ access_token: accessToken })

  const calendar = google.calendar({ version: 'v3', auth })

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      ...event,
      start: {
        ...event.start,
        timeZone: event.start.timeZone || 'America/Indiana/Indianapolis',
      },
      end: {
        ...event.end,
        timeZone: event.end.timeZone || 'America/Indiana/Indianapolis',
      },
    },
  })

  return {
    id: response.data.id || '',
    htmlLink: response.data.htmlLink || undefined,
  }
}

export async function listGoogleCalendarEvents(
  accessToken: string,
  timeMin?: string,
  timeMax?: string,
  maxResults: number = 100
): Promise<GoogleCalendarEvent[]> {
  const auth = new OAuth2Client()
  auth.setCredentials({ access_token: accessToken })

  const calendar = google.calendar({ version: 'v3', auth })

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: timeMin || new Date().toISOString(),
    timeMax,
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  })

  return (response.data.items || []).map((item) => ({
    id: item.id,
    summary: item.summary || '',
    description: item.description || undefined,
    start: {
      dateTime: item.start?.dateTime || item.start?.date || '',
      timeZone: item.start?.timeZone,
    },
    end: {
      dateTime: item.end?.dateTime || item.end?.date || '',
      timeZone: item.end?.timeZone,
    },
    location: item.location || undefined,
  }))
}

export async function updateGoogleCalendarEvent(
  accessToken: string,
  eventId: string,
  event: Partial<GoogleCalendarEvent>
): Promise<void> {
  const auth = new OAuth2Client()
  auth.setCredentials({ access_token: accessToken })

  const calendar = google.calendar({ version: 'v3', auth })

  await calendar.events.patch({
    calendarId: 'primary',
    eventId,
    requestBody: event as any,
  })
}

export async function deleteGoogleCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<void> {
  const auth = new OAuth2Client()
  auth.setCredentials({ access_token: accessToken })

  const calendar = google.calendar({ version: 'v3', auth })

  await calendar.events.delete({
    calendarId: 'primary',
    eventId,
  })
}

export async function refreshGoogleAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; expiryDate: Date }> {
  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  const { credentials } = await oauth2Client.refreshAccessToken()
  
  return {
    accessToken: credentials.access_token!,
    expiryDate: credentials.expiry_date ? new Date(credentials.expiry_date) : new Date(Date.now() + 3600 * 1000),
  }
}

