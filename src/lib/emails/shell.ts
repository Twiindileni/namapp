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
  const safePre = escapeHtml(preheader)
  const safeHeadline = escapeHtml(headline)

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
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
  
  body {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    -webkit-text-size-adjust: 100% !important;
    -ms-text-size-adjust: 100% !important;
  }
  
  table, td {
    mso-table-lspace: 0pt !important;
    mso-table-rspace: 0pt !important;
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#eff3f8;">
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">${safePre}</div>
  
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#eff3f8; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px; background-color: #ffffff; border-radius: 32px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.05);">
          
          <!-- Header Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #020b1a 0%, #003580 100%); padding: 48px 40px; text-align: center;">
              <div style="margin-bottom: 16px;">
                <span style="font-family: 'Inter', -apple-system, sans-serif; font-size: 11px; font-weight: 800; color: #5a9ef5; letter-spacing: 0.4em; text-transform: uppercase;">Purpose Technology</span>
              </div>
              <h1 style="margin: 0; font-family: 'Inter', -apple-system, sans-serif; font-size: 28px; font-weight: 700; color: #ffffff; line-height: 1.2; letter-spacing: -0.02em;">${safeHeadline}</h1>
            </td>
          </tr>

          <!-- Accent Bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #1a72f0 0%, #003580 100%); font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 48px 40px 0; font-family: 'Inter', -apple-system, sans-serif; font-size: 15px; line-height: 1.6; color: #1f2937;">
              ${innerHtml}
            </td>
          </tr>

          <!-- CTA Section -->
          ${ctaBlock}

          <!-- Footer Area -->
          <tr>
            <td style="padding: 48px 40px 40px; font-family: 'Inter', -apple-system, sans-serif; border-top: 1px solid #f3f4f6; margin-top: 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding-bottom: 24px;">
                    <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.5;">
                      Questions? Reach out to our technical desk at<br />
                      <a href="mailto:admin@purposetech.online" style="color: #1a72f0; font-weight: 600; text-decoration: none;">admin@purposetech.online</a>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="border-top: 1px solid #f3f4f6; padding-top: 24px;">
                    <p style="margin: 0; font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">
                      © ${new Date().getFullYear()} Purpose Technology Namibia
                    </p>
                    <p style="margin: 6px 0 0; font-size: 11px; color: #9ca3af;">
                      The digital heartbeat of Namibia. <a href="https://purposetech.online" style="color: #6b7280; text-decoration: underline;">Visit our platform</a>
                    </p>
                    ${unsubscribeUrl
                      ? `<p style="margin: 12px 0 0; font-size: 11px; color: #9ca3af;">
                          Don't want to receive newsletters? <a href="${escapeHtml(unsubscribeUrl)}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a>
                        </p>`
                      : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Social / Legal Footer -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px;">
          <tr>
            <td style="padding: 32px 16px; text-align: center; font-family: 'Inter', -apple-system, sans-serif; font-size: 11px; color: #9ca3af; line-height: 1.6;">
              You are receiving this automated communication regarding your account or activity on the Purpose Technology platform.<br />
              Windhoek, Namibia · Trust through Transparency.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
