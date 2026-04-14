export { escapeHtml } from './escape-html'
export { buildEmailShell } from './shell'
export {
  type TemplateId,
  type EmailMergeFields,
  TEMPLATE_META,
  defaultMergeForTemplate,
  renderEmail,
} from './templates'

export const TEMPLATE_IDS = [
  'photography_booking_reminder',
  'driving_class_reminder',
  'device_tracking_update',
  'signal_market_update',
  'loan_application_update',
  'welcome_signup',
  'newsletter_product_update',
] as const
