import { escapeHtml } from './escape-html'
import { buildEmailShell } from './shell'

export type TemplateId =
  | 'photography_booking_reminder'
  | 'driving_class_reminder'
  | 'device_tracking_update'
  | 'signal_market_update'
  | 'loan_application_update'
  | 'welcome_signup'
  | 'newsletter_product_update'

export type EmailMergeFields = Record<string, string>

function val(merge: EmailMergeFields, key: string, fallback: string): string {
  const v = merge[key]?.trim()
  return escapeHtml(v && v.length > 0 ? v : fallback)
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 20px; font-family: 'Inter', -apple-system, sans-serif; font-size: 15px; line-height: 1.6; color: #374151;">${text}</p>`
}

function callout(html: string, accentColor: string = '#1a72f0'): string {
  return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0; border-radius:16px; background-color: #f9fafb; border: 1px solid #e5e7eb;">
  <tr>
    <td style="padding: 24px; border-left: 4px solid ${accentColor}; border-radius: 16px;">
      ${html}
    </td>
  </tr>
</table>`
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 0; font-family: 'Inter', -apple-system, sans-serif; font-size:12px; font-weight:700; color:#6b7280; width:35%; vertical-align:top; text-transform: uppercase; letter-spacing: 0.05em;">${escapeHtml(label)}</td>
    <td style="padding:10px 0; font-family: 'Inter', -apple-system, sans-serif; font-size:14px; font-weight:600; color:#111827; vertical-align:top;">${value}</td>
  </tr>`
}

function badge(html: string, color: string = '#1a72f0', bg: string = '#eff6ff'): string {
  return `<span style="display:inline-block; padding: 4px 12px; background-color: ${bg}; color: ${color}; border-radius: 9999px; font-family: 'Inter', -apple-system, sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">${html}</span>`
}

function newsletterSectionHeader(title: string): string {
  return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 40px; margin-bottom: 16px;">
  <tr>
    <td style="font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 800; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.3em; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px;">
      ${escapeHtml(title)}
    </td>
  </tr>
</table>`
}

function newsletterProductCard(name: string, desc: string, price: string, imageUrl?: string): string {
  const imagePart = imageUrl 
    ? `<div style="margin-bottom: 24px;">
         <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(name)}" width="520" style="width:100%; max-width:100%; height:auto; border-radius: 20px; display:block; object-fit: cover;" />
       </div>`
    : ''
    
  return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0; background-color: #ffffff; border: 1px solid #f3f4f6; border-radius: 32px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
  <tr>
    <td style="padding: 32px;">
      ${imagePart}
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td>
            <h3 style="margin: 0 0 8px; font-family: 'Inter', sans-serif; font-size: 24px; font-weight: 700; color: #111827; letter-spacing: -0.01em;">${escapeHtml(name)}</h3>
            <p style="margin: 0 0 20px; font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.5; color: #6b7280;">${escapeHtml(desc)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding-top: 16px; border-top: 1px solid #f3f4f6;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 800; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em;">Price Status</td>
                <td align="right" style="font-family: 'Inter', sans-serif; font-size: 20px; font-weight: 700; color: #1a72f0;">${escapeHtml(price)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`
}

export const TEMPLATE_META: Record<
  TemplateId,
  {
    label: string
    shortLabel: string
    description: string
    defaultSubject: string
    defaultCtaHref: string
    defaultCtaLabel: string
    fields: { key: string; label: string; placeholder: string }[]
  }
> = {
  photography_booking_reminder: {
    label: 'Photography booking reminder',
    shortLabel: 'Photography',
    description: 'Remind clients about an upcoming or pending photoshoot booking.',
    defaultSubject: 'Your photography session — Purpose Technology',
    defaultCtaHref: 'https://purposetech.online/categories',
    defaultCtaLabel: 'View photography hub',
    fields: [
      { key: 'customerName', label: 'Customer name', placeholder: 'Jane M.' },
      { key: 'eventType', label: 'Event / session type', placeholder: 'Wedding' },
      { key: 'eventDate', label: 'Event date', placeholder: 'Saturday, 24 May 2026' },
      { key: 'eventLocation', label: 'Location', placeholder: 'Windhoek — venue TBC' },
      { key: 'packageName', label: 'Package', placeholder: 'Standard Package' },
      { key: 'extraMessage', label: 'Extra note (optional)', placeholder: 'Please arrive 15 minutes early for setup.' },
    ],
  },
  driving_class_reminder: {
    label: 'Driving school reminder',
    shortLabel: 'Driving school',
    description: 'Lesson reminders, schedule changes, or progress encouragement.',
    defaultSubject: 'Your driving lesson — Purpose Technology',
    defaultCtaHref: 'https://purposetech.online/driving-school',
    defaultCtaLabel: 'Open driving portal',
    fields: [
      { key: 'customerName', label: 'Student name', placeholder: 'John K.' },
      { key: 'lessonDate', label: 'Lesson date / time', placeholder: 'Wed 14 May, 09:00' },
      { key: 'packageName', label: 'Package (optional)', placeholder: '10-hour bundle' },
      { key: 'instructorNote', label: 'Instructor message', placeholder: 'We will practise parallel parking this session.' },
      { key: 'bookingStatus', label: 'Booking status (auto from portal)', placeholder: 'confirmed' },
      { key: 'hoursPurchased', label: 'Hours purchased (auto from portal)', placeholder: '10' },
      { key: 'hoursUsed', label: 'Hours used (auto from portal)', placeholder: '4' },
      { key: 'hoursLeft', label: 'Hours left (auto from portal)', placeholder: '6' },
      { key: 'totalPaid', label: 'Amount paid (auto from portal)', placeholder: 'N$ 1300.00' },
      { key: 'extraMessage', label: 'Extra note (optional)', placeholder: 'Bring your learner licence.' },
    ],
  },
  device_tracking_update: {
    label: 'Device / IMEI tracking update',
    shortLabel: 'Device tracking',
    description: 'Updates on registered devices, tracking requests, or recovery steps.',
    defaultSubject: 'Update on your device registration — Purpose Technology',
    defaultCtaHref: 'https://purposetech.online/devices',
    defaultCtaLabel: 'Device portal',
    fields: [
      { key: 'customerName', label: 'Customer name', placeholder: 'Alex N.' },
      { key: 'deviceName', label: 'Device label', placeholder: 'iPhone 15' },
      { key: 'imeiLast4', label: 'IMEI hint (optional)', placeholder: '…4821' },
      { key: 'statusMessage', label: 'Status / update', placeholder: 'Your tracking request is now under review.' },
      { key: 'extraMessage', label: 'Extra note (optional)', placeholder: '' },
    ],
  },
  signal_market_update: {
    label: 'Signal / market update',
    shortLabel: 'Signals',
    description: 'Notify traders about new signals, summaries, or platform news.',
    defaultSubject: 'Market signal update — Purpose Technology',
    defaultCtaHref: 'https://purposetech.online/signal',
    defaultCtaLabel: 'View signals',
    fields: [
      { key: 'customerName', label: 'Recipient name (or “Trader”)', placeholder: 'Trader' },
      { key: 'instrument', label: 'Instrument (optional)', placeholder: 'XAUUSD' },
      { key: 'headline', label: 'Headline', placeholder: 'New GOLD outlook published' },
      { key: 'summary', label: 'Summary', placeholder: 'We have posted an updated buy zone and targets in the app.' },
      { key: 'extraMessage', label: 'Extra note (optional)', placeholder: '' },
    ],
  },
  loan_application_update: {
    label: 'Loan application update',
    shortLabel: 'Loans',
    description: 'Status updates and next steps for borrow / loan applicants.',
    defaultSubject: 'Your loan application — Purpose Technology',
    defaultCtaHref: 'https://purposetech.online/borrow',
    defaultCtaLabel: 'Borrow hub',
    fields: [
      { key: 'customerName', label: 'Applicant name', placeholder: 'Sarah T.' },
      { key: 'reference', label: 'Reference / ID (optional)', placeholder: 'LN-1024' },
      { key: 'statusMessage', label: 'Status message', placeholder: 'Your application is approved pending final documents.' },
      { key: 'nextStep', label: 'Next step', placeholder: 'Please upload your latest payslip in the portal.' },
      { key: 'extraMessage', label: 'Extra note (optional)', placeholder: '' },
    ],
  },
  welcome_signup: {
    label: 'Welcome / thank-you email',
    shortLabel: 'Welcome',
    description: 'Sent automatically when a new user registers. Thanks them and introduces the platform.',
    defaultSubject: 'Welcome to Purpose Technology — you\'re in!',
    defaultCtaHref: 'https://purposetech.online',
    defaultCtaLabel: 'Explore the platform',
    fields: [
      { key: 'customerName', label: 'Name', placeholder: 'Alex' },
    ],
  },
  newsletter_product_update: {
    label: 'Newsletter / product update',
    shortLabel: 'Newsletter',
    description: 'Send product specials, new arrivals, and promotions to newsletter subscribers.',
    defaultSubject: 'New arrivals & specials — Purpose Technology',
    defaultCtaHref: 'https://purposetech.online',
    defaultCtaLabel: 'Shop now',
    fields: [
      { key: 'newsletterHeadline', label: 'Newsletter headline', placeholder: 'Fresh arrivals — don\'t miss out!' },
      { key: 'introText', label: 'Intro paragraph', placeholder: 'We\'ve just added exciting new products and exclusive specials to the store. Here\'s what\'s hot this week.' },
      { key: 'featuredProductName', label: 'Featured product name', placeholder: 'Samsung Galaxy S25 Ultra' },
      { key: 'featuredProductDesc', label: 'Featured product description', placeholder: 'The most powerful Galaxy yet — now available at Purpose Technology.' },
      { key: 'featuredProductPrice', label: 'Featured product price (optional)', placeholder: 'N$ 21,999' },
      { key: 'featuredProductImage', label: 'Featured product image URL (auto-filled)', placeholder: 'https://...' },
      { key: 'specialOffer', label: 'Special offer / promo (optional)', placeholder: '10% off all accessories this weekend only. Use code: PURPOSE10' },
      { key: 'extraMessage', label: 'Closing note (optional)', placeholder: 'Thank you for being part of the Purpose Technology community.' },
    ],
  },
}

export function defaultMergeForTemplate(id: TemplateId): EmailMergeFields {
  const fields = TEMPLATE_META[id].fields
  const o: EmailMergeFields = {}
  for (const f of fields) {
    o[f.key] = f.placeholder
  }
  return o
}

function stripHtmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function renderEmail(
  templateId: TemplateId,
  merge: EmailMergeFields,
  options?: { unsubscribeUrl?: string }
): { subject: string; html: string; text: string } {
  const meta = TEMPLATE_META[templateId]
  const subject = meta.defaultSubject

  let innerHtml = ''
  let headline = ''

  switch (templateId) {
    case 'photography_booking_reminder': {
      headline = 'Photography session reminder'
      const name = val(merge, 'customerName', 'there')
      const eventType = val(merge, 'eventType', 'your session')
      const eventDate = val(merge, 'eventDate', 'your scheduled date')
      const loc = val(merge, 'eventLocation', 'as agreed')
      const pkg = val(merge, 'packageName', 'your selected package')
      const extra = merge.extraMessage?.trim()
        ? paragraph(val(merge, 'extraMessage', ''))
        : ''
      innerHtml =
        badge('Shoot Scheduled', '#1a72f0', '#eff6ff') +
        paragraph(`Hi ${name},`) +
        paragraph(
          `We're looking forward to capturing your <strong style="color: #111827;">${eventType}</strong>. Here is a quick recap of your upcoming session with Purpose Technology.`
        ) +
        callout(
          `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${detailRow('Date', eventDate)}${detailRow('Location', loc)}${detailRow('Package', pkg)}</table>`
        ) +
        extra +
        paragraph(`If any details have changed, please reply to this email so our team can adjust the plan accordingly.`)
      break
    }
    case 'driving_class_reminder': {
      headline = 'Driving lesson reminder'
      const name = val(merge, 'customerName', 'there')
      const when = val(merge, 'lessonDate', 'your upcoming slot')
      const pkg = merge.packageName?.trim() ? val(merge, 'packageName', '') : ''
      const note = val(merge, 'instructorNote', 'Your instructor will confirm focus areas on arrival.')
      const bookingStatus = merge.bookingStatus?.trim() ? val(merge, 'bookingStatus', '') : ''
      const hoursPurchased = merge.hoursPurchased?.trim() ? val(merge, 'hoursPurchased', '') : ''
      const hoursUsed = merge.hoursUsed?.trim() ? val(merge, 'hoursUsed', '') : ''
      const hoursLeft = merge.hoursLeft?.trim() ? val(merge, 'hoursLeft', '') : ''
      const totalPaid = merge.totalPaid?.trim() ? val(merge, 'totalPaid', '') : ''
      const extra = merge.extraMessage?.trim()
        ? paragraph(val(merge, 'extraMessage', ''))
        : ''
      innerHtml =
        badge('Lesson Reminder', '#059669', '#ecfdf5') +
        paragraph(`Hi ${name},`) +
        paragraph(`This is a friendly reminder about your upcoming lesson with <strong style="color: #111827;">Purpose Technology Driving School</strong>.`) +
        callout(
          `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${detailRow('Scheduled', when)}${pkg ? detailRow('Package', pkg) : ''}${bookingStatus ? detailRow('Booking status', bookingStatus) : ''}${hoursPurchased ? detailRow('Hours purchased', hoursPurchased) : ''}${hoursUsed ? detailRow('Hours used', hoursUsed) : ''}${hoursLeft ? detailRow('Hours remaining', hoursLeft) : ''}${totalPaid ? detailRow('Amount paid', totalPaid) : ''}${detailRow('Instructor Note', note)}</table>`,
          '#059669'
        ) +
        extra +
        paragraph(`See you on the road — drive safe and arrive a few minutes early to maximize your session.`)
      break
    }
    case 'device_tracking_update': {
      headline = 'Device registration update'
      const name = val(merge, 'customerName', 'there')
      const device = val(merge, 'deviceName', 'your device')
      const imei = merge.imeiLast4?.trim() ? val(merge, 'imeiLast4', '') : ''
      const status = val(merge, 'statusMessage', 'There is an update regarding your registration.')
      const extra = merge.extraMessage?.trim()
        ? paragraph(val(merge, 'extraMessage', ''))
        : ''
      innerHtml =
        badge('Device Tracking', '#7c3aed', '#f5f3ff') +
        paragraph(`Hi ${name},`) +
        paragraph(
          `Here is an update regarding your <strong style="color: #111827;">${device}</strong>${imei ? ` (IMEI …${imei})` : ''} in our security programme.`
        ) +
        callout(`<p style="margin:0; font-family: 'Inter', sans-serif; font-size:15px; font-weight: 500; line-height:1.55; color:#374151;">${status}</p>`, '#7c3aed') +
        extra +
        paragraph(`You can manage your registered devices and active tracking requests anytime via our secure portal.`)
      break
    }
    case 'signal_market_update': {
      headline = val(merge, 'headline', 'Market desk update')
      const name = val(merge, 'customerName', 'there')
      const instrument = merge.instrument?.trim()
        ? badge(val(merge, 'instrument', ''), '#1a72f0', '#eff6ff')
        : ''
      const summary = val(merge, 'summary', 'Check the latest market outlook and levels in our signal dashboard.')
      const extra = merge.extraMessage?.trim()
        ? paragraph(val(merge, 'extraMessage', ''))
        : ''
      innerHtml =
        instrument +
        paragraph(`Hi ${name},`) +
        paragraph(`Our market desk has shared a high-conviction update regarding current market conditions.`) +
        callout(`<p style="margin:0; font-family: 'Inter', sans-serif; font-size:15px; font-weight: 500; line-height:1.55; color:#374151;">${summary}</p>`, '#1a72f0') +
        extra +
        paragraph(`<strong>Risk Disclaimer:</strong> Trading involves significant risk. This message is informational and does not constitute personal financial advice.`)
      break
    }
    case 'loan_application_update': {
      headline = 'Loan application update'
      const name = val(merge, 'customerName', 'there')
      const ref = merge.reference?.trim() ? val(merge, 'reference', '') : ''
      const status = val(merge, 'statusMessage', 'We have an update on your application.')
      const next = val(merge, 'nextStep', 'Our team will reach out if further documentation is required.')
      const extra = merge.extraMessage?.trim()
        ? paragraph(val(merge, 'extraMessage', ''))
        : ''
      innerHtml =
        badge('Application Update', '#db2777', '#fdf2f8') +
        paragraph(`Hi ${name},`) +
        paragraph(`Thank you for choosing Purpose Technology for your financial needs.${ref ? ` Your application reference: <strong style="color: #111827;">${ref}</strong>.` : ''}`) +
        callout(
          `<p style="margin:0 0 12px; font-family: 'Inter', sans-serif; font-size:15px; font-weight: 600; line-height:1.55; color:#111827;">${status}</p><p style="margin:0; font-family: 'Inter', sans-serif; font-size:14px; line-height:1.55; color:#4b5563;"><strong style="color:#1a72f0;">Next Step:</strong> ${next}</p>`,
          '#db2777'
        ) +
        extra +
        paragraph(`If you have any questions, simply reply to this email — our desk is ready to assist.`)
      break
    }
    case 'welcome_signup': {
      headline = 'Welcome to Purpose Technology!'
      const name = val(merge, 'customerName', 'there')
      innerHtml =
        badge('Account Created', '#059669', '#ecfdf5') +
        paragraph(`Hi ${name},`) +
        paragraph(
          `We're thrilled to have you on board! Your Purpose Technology account is all set and ready to go.`
        ) +
        callout(
          `<p style="margin:0 0 12px; font-family: 'Inter', sans-serif; font-size:15px; font-weight:600; color:#111827;">Here's what you can do on our platform:</p>` +
          `<ul style="margin:0; padding-left:20px; font-family:'Inter',sans-serif; font-size:14px; line-height:1.8; color:#374151;">` +
          `<li>Browse and order the latest tech products &amp; accessories</li>` +
          `<li>Book professional photography sessions</li>` +
          `<li>Register and track your devices with our security programme</li>` +
          `<li>Access forex signals from our market desk</li>` +
          `<li>Explore driving school packages</li>` +
          `</ul>`,
          '#059669'
        ) +
        paragraph(
          `If you ever need help, our team is always a reply away at ` +
          `<a href="mailto:admin@purposetech.online" style="color:#1a72f0; font-weight:600; text-decoration:none;">admin@purposetech.online</a>.`
        ) +
        paragraph(`Welcome aboard — let's build something great together.`)
      break
    }
    case 'newsletter_product_update': {
      headline = val(merge, 'newsletterHeadline', "Fresh arrivals — don't miss out!")
      const intro = val(merge, 'introText', 'We\'ve just added exciting new products and exclusive specials to the store. Here\'s what\'s hot this week.')
      const productName = val(merge, 'featuredProductName', 'Psalm 91:1-6 Framed Art')
      const productDesc = val(merge, 'featuredProductDesc', 'A premium, high-definition framed art piece featuring the powerful words of Psalm 91. Perfect for modern interior styling.')
      const productPrice = val(merge, 'featuredProductPrice', 'N$ 850.00')
      const productImage = merge.featuredProductImage?.trim() ? merge.featuredProductImage.trim() : 'https://purposetech.online/placeholder-newsletter-item.jpg'
      const specialOffer = merge.specialOffer?.trim() ? val(merge, 'specialOffer', '') : ''
      const extra = merge.extraMessage?.trim() ? paragraph(val(merge, 'extraMessage', '')) : ''

      innerHtml =
        badge('Weekly Dispatch', '#1a72f0', '#eff6ff') +
        paragraph(intro) +
        newsletterSectionHeader('Featured Creation') +
        newsletterProductCard(productName, productDesc, productPrice, productImage) +
        (specialOffer
          ? newsletterSectionHeader('Exclusive Protocol') +
            callout(
              `<p style="margin:0 0 4px; font-family:'Inter',sans-serif; font-size:11px; font-weight:800; color:#db2777; text-transform:uppercase; letter-spacing:0.1em;">Limited Time Activation</p>` +
              `<p style="margin:0; font-family:'Inter',sans-serif; font-size:16px; font-weight:600; color:#111827;">${specialOffer}</p>`,
              '#db2777'
            )
          : '') +
        extra +
        paragraph(`Stay tuned for more great deals and product drops from Namibia's premier tech and digital art hub.`)
      break
    }
    default:
      headline = 'Message from Purpose Technology'
      innerHtml = paragraph('Hello,') + paragraph('You have a new secure communication from Purpose Technology.')
  }

  const html = buildEmailShell({
    preheader: stripHtmlToText(innerHtml).slice(0, 140) || meta.description,
    headline,
    innerHtml,
    ctaHref: meta.defaultCtaHref,
    ctaLabel: meta.defaultCtaLabel,
    unsubscribeUrl: options?.unsubscribeUrl,
  })

  return {
    subject,
    html,
    text: stripHtmlToText(innerHtml) + ` ${meta.defaultCtaLabel}: ${meta.defaultCtaHref}`,
  }
}
