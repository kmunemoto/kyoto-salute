/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as newBookingNotification } from './new-booking-notification.tsx'
import { template as bookingConfirmation } from './booking-confirmation.tsx'
import { template as trialBookingConfirmation } from './trial-booking-confirmation.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'new-booking-notification': newBookingNotification,
  'booking-confirmation': bookingConfirmation,
  'trial-booking-confirmation': trialBookingConfirmation,
}
