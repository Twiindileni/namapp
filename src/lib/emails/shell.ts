import { escapeHtml } from './escape-html'

export type EmailShellOptions = {
  /** Shown in inbox preview line (hidden in body) */
  preheader: string
  /** Document title + accessible heading */
  headline: string
  /** Main HTML fragment (already escaped where needed) */
  innerHtml: string
  ctaHref?: string
  ctaLabel?: string
  /** When set, an unsubscribe link is appended to the footer (for newsletter emails) */
  unsubscribeUrl?: string
}

/**
 * Table-based, client-safe HTML shell for broad email client support.
 * Optimized for Purpose Technology "Clean Professional" aesthetic.
 */
export function buildEmailShell(opts: EmailShellOptions): string {
  const { preheader, headline, innerHtml, ctaHref, ctaLabel, unsubscribeUrl } = opts
  // Callers are responsible for escaping. We escape only the raw-text fields
  // that are NOT already HTML-safe (preheader is plain text; innerHtml / headline
  // come pre-escaped from renderEmail / buildCustomHtml).
  const safePre      = escapeHtml(preheader)
  // headline arrives pre-escaped from renderEmail (via val()) or buildCustomHtml.
  const safeHeadline = headline

  const ctaBlock =
    ctaHref && ctaLabel
      ? `
          <tr>
            <td style="padding:12px 40px 0; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius:14px; background-color: #1a72f0;">
                    <a href="${escapeHtml(ctaHref)}" target="_blank" rel="noopener noreferrer"
                      style="display:inline-block; padding:18px 36px; font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:14px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:14px; text-transform: uppercase; letter-spacing: 0.1em;">
                      ${escapeHtml(ctaLabel)}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
      : ''

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${safeHeadline}</title>
<!--[if mso]>
<xml>
  <o:OfficeDocumentSettings>
    <o:AllowPNG/>
    <o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings>
</xml>
<![endif]-->
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  /* ── Reset ── */
  *, *::before, *::after { box-sizing: border-box; }
  body {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    min-width: 100% !important;
    background-color: #eff3f8 !important;
    -webkit-text-size-adjust: 100% !important;
    -ms-text-size-adjust: 100% !important;
  }
  table, td { mso-table-lspace: 0pt !important; mso-table-rspace: 0pt !important; }
  img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; display: block; }
  a { color: #1a72f0; }

  /* ── Layout helpers ── */
  .email-wrapper  { width: 100% !important; background-color: #eff3f8 !important; }
  .email-outer    { padding: 40px 20px !important; }
  .email-card     { max-width: 600px !important; width: 100% !important; margin: 0 auto !important;
                    background-color: #ffffff; border-radius: 32px; overflow: hidden;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.06); }

  /* ── Header ── */
  .email-header   { background: linear-gradient(135deg, #020b1a 0%, #003580 100%) !important;
                    padding: 48px 40px !important; text-align: center !important; }
  .email-brand    { font-family: 'Inter', -apple-system, sans-serif; font-size: 11px; font-weight: 800;
                    color: #5a9ef5 !important; letter-spacing: 0.4em; text-transform: uppercase;
                    display: block; margin-bottom: 16px; }
  .email-headline { margin: 0 !important; font-family: 'Inter', -apple-system, sans-serif;
                    font-size: 28px !important; font-weight: 700; color: #ffffff !important;
                    line-height: 1.25 !important; letter-spacing: -0.02em; }

  /* ── Body ── */
  .email-body     { padding: 48px 40px 0 !important; font-family: 'Inter', -apple-system, sans-serif;
                    font-size: 15px; line-height: 1.7; color: #1f2937; }

  /* ── CTA button ── */
  .email-cta-wrap { padding: 32px 40px 0 !important; text-align: center !important; }
  .email-cta      { display: inline-block !important; padding: 18px 40px !important;
                    background-color: #1a72f0 !important; color: #ffffff !important;
                    font-family: 'Inter', -apple-system, sans-serif; font-size: 14px !important;
                    font-weight: 700 !important; text-decoration: none !important;
                    border-radius: 14px !important; text-transform: uppercase;
                    letter-spacing: 0.08em; mso-padding-alt: 0; }

  /* ── Footer ── */
  .email-footer   { padding: 40px 40px 36px !important; border-top: 1px solid #f3f4f6; }
  .email-footer p { margin: 0; font-family: 'Inter', -apple-system, sans-serif; }
  .email-legal    { padding: 28px 16px !important; text-align: center !important;
                    font-family: 'Inter', -apple-system, sans-serif; font-size: 11px;
                    color: #9ca3af; line-height: 1.7; }

  /* ────────────────────────────────────────────────
     RESPONSIVE — phones (max 600px)
  ──────────────────────────────────────────────── */
  @media only screen and (max-width: 620px) {
    .email-outer    { padding: 16px 8px !important; }
    .email-card     { border-radius: 20px !important; width: 100% !important; }

    .email-header   { padding: 36px 24px !important; }
    .email-headline { font-size: 22px !important; line-height: 1.3 !important; }
    .email-brand    { font-size: 10px !important; letter-spacing: 0.3em !important; }

    .email-body     { padding: 32px 24px 0 !important; font-size: 15px !important; }

    .email-cta-wrap { padding: 24px 24px 0 !important; }
    .email-cta      { display: block !important; width: 100% !important;
                      padding: 16px 24px !important; font-size: 13px !important;
                      border-radius: 12px !important; text-align: center !important; }

    .email-footer   { padding: 28px 24px 24px !important; }
    .email-legal    { padding: 20px 12px !important; font-size: 11px !important; }

    /* Stack info rows in data callout tables */
    .info-row-label,
    .info-row-value { display: block !important; width: 100% !important; }
    .info-row-label { padding-bottom: 2px !important; }
    .info-row-value { padding-bottom: 12px !important; text-align: left !important; }
  }

  /* ────────────────────────────────────────────────
     DARK MODE (Apple Mail, Outlook 2019+, Gmail app)
  ──────────────────────────────────────────────── */
  @media (prefers-color-scheme: dark) {
    .email-wrapper,
    body                { background-color: #0d1117 !important; }
    .email-card         { background-color: #161b22 !important; box-shadow: 0 10px 40px rgba(0,0,0,0.4) !important; }
    .email-body         { color: #c9d1d9 !important; }
    .email-footer       { border-top-color: #30363d !important; }
    .email-footer p,
    .email-legal        { color: #8b949e !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#eff3f8;" class="email-wrapper">
  <!-- Inbox preview text (hidden) -->
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; color:#eff3f8;">${safePre}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="email-wrapper">
    <tr>
      <td class="email-outer" align="center" style="padding:40px 20px; background-color:#eff3f8;">

        <!-- ══ Card ══ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="email-card"
          style="max-width:600px; width:100%; background-color:#ffffff; border-radius:32px; overflow:hidden; box-shadow:0 10px 40px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td class="email-header" style="background:linear-gradient(135deg,#020b1a 0%,#003580 100%); padding:48px 40px; text-align:center;">
              <span class="email-brand" style="display:block; margin-bottom:16px; font-family:'Inter',-apple-system,sans-serif; font-size:11px; font-weight:800; color:#5a9ef5; letter-spacing:0.4em; text-transform:uppercase;">Purpose Technology</span>
              <h1 class="email-headline" style="margin:0; font-family:'Inter',-apple-system,sans-serif; font-size:28px; font-weight:700; color:#ffffff; line-height:1.25; letter-spacing:-0.02em;">${safeHeadline}</h1>
            </td>
          </tr>

          <!-- Accent bar -->
          <tr>
            <td style="height:4px; background:linear-gradient(90deg,#1a72f0 0%,#003580 100%); font-size:0; line-height:0;">&nbsp;</td>
          </tr>

          <!-- Body content -->
          <tr>
            <td class="email-body" style="padding:48px 40px 0; font-family:'Inter',-apple-system,sans-serif; font-size:15px; line-height:1.7; color:#1f2937;">
              ${innerHtml}
            </td>
          </tr>

          <!-- CTA button -->
          ${ctaHref && ctaLabel ? `
          <tr>
            <td class="email-cta-wrap" style="padding:32px 40px 0; text-align:center;">
              <!--[if mso]>
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
                href="${escapeHtml(ctaHref)}" style="height:56px;v-text-anchor:middle;width:240px;" arcsize="25%" fillcolor="#1a72f0" stroke="f">
                <w:anchorlock/>
                <center style="color:#ffffff; font-family:'Inter',sans-serif; font-size:14px; font-weight:700;">${escapeHtml(ctaLabel)}</center>
              </v:roundrect>
              <![endif]-->
              <!--[if !mso]><!-->
              <a class="email-cta" href="${escapeHtml(ctaHref)}" target="_blank" rel="noopener noreferrer"
                style="display:inline-block; padding:18px 40px; background-color:#1a72f0; color:#ffffff; font-family:'Inter',-apple-system,sans-serif; font-size:14px; font-weight:700; text-decoration:none; border-radius:14px; text-transform:uppercase; letter-spacing:0.08em;">
                ${escapeHtml(ctaLabel)}
              </a>
              <!--<![endif]-->
            </td>
          </tr>` : ''}

          <!-- Footer -->
          <tr>
            <td class="email-footer" style="padding:40px 40px 36px; border-top:1px solid #f3f4f6; font-family:'Inter',-apple-system,sans-serif;">
              <p style="margin:0 0 16px; font-size:13px; color:#6b7280; line-height:1.6;">
                Questions? Contact our team at&nbsp;<a href="mailto:admin@purposetech.online" style="color:#1a72f0; font-weight:600; text-decoration:none;">admin@purposetech.online</a>
              </p>
              <p style="margin:0; font-size:11px; font-weight:700; color:#9ca3af; text-transform:uppercase; letter-spacing:0.06em;">
                &copy; ${new Date().getFullYear()} Purpose Technology Namibia
              </p>
              <p style="margin:6px 0 0; font-size:11px; color:#9ca3af;">
                The digital heartbeat of Namibia.&nbsp;<a href="https://purposetech.online" style="color:#6b7280; text-decoration:underline;">Visit our platform</a>
              </p>
              ${unsubscribeUrl
                ? `<p style="margin:10px 0 0; font-size:11px; color:#9ca3af;">
                    Don't want these emails?&nbsp;<a href="${escapeHtml(unsubscribeUrl)}" style="color:#6b7280; text-decoration:underline;">Unsubscribe</a>
                   </p>`
                : ''}
            </td>
          </tr>

        </table>
        <!-- ══ End card ══ -->

        <!-- Legal footer below card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;">
          <tr>
            <td class="email-legal" style="padding:28px 16px; text-align:center; font-family:'Inter',-apple-system,sans-serif; font-size:11px; color:#9ca3af; line-height:1.7;">
              You are receiving this because of your activity on the Purpose Technology platform.<br>
              Windhoek, Namibia &middot; Trust through Transparency.
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`
}
