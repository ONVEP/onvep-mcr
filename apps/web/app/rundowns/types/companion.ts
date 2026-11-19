// Every live item carries the `seq` of its last change, so the browser can merge a
// snapshot with events that raced it: the higher `seq` wins.

export type CompanionStatus = { seq: number; connected: boolean; error: string | null }

export type CompanionPage = {
  // Stable Companion page id; the page number changes when pages are moved or inserted.
  id: string
  number: number
  name: string
  buttonCount: number
}

export type CompanionPages = { seq: number; list: CompanionPage[] }

export type CompanionButton = {
  seq: number
  pageId: string
  page: number
  row: number
  column: number
  // PNG data URL as rendered by Companion (variables resolved); null until the first frame.
  image: string | null
  // Companion control type: `button`, `button-layered`, or a page navigation control (`pageup`…).
  controlType: string | null
  // Text as configured on the button, e.g. `Il est $(internal:time_hms)`.
  textSource: string | null
  // The same text with its variables resolved, kept up to date by Companion.
  text: string | null
  textError: string | null
}

export type CompanionSnapshot = {
  // Last change included: any item missing from the snapshot with a lower seq was removed.
  seq: number
  status: CompanionStatus
  pages: CompanionPages | null
  buttons: CompanionButton[]
}

export type CompanionLiveEvent =
  | { type: 'status'; status: CompanionStatus }
  | { type: 'pages'; pages: CompanionPages }
  | { type: 'button'; button: CompanionButton }
  | { type: 'button_removed'; seq: number; pageId: string; row: number; column: number }
