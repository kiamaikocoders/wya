-- Seed/update communication_templates with Figma WYA email HTML (page 16 — Emails)
INSERT INTO public.communication_templates (id, category, name, subject, html, description) VALUES
  ('confirm-signup', 'auth', 'Confirm signup', 'Confirm your email — WYA',
   '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirm Your Email - WYA</title>
</head>
<body style="margin:0;padding:0;background:#f6f8fa;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fa;">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 14px 0;">
              <img src="{{ .SiteURL }}/emails/wya-logo.png" alt="WYA" width="96" height="64" style="display:block;border:0;height:64px;width:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <img src="{{ .SiteURL }}/emails/hero-welcome.jpg" alt="" width="520" height="180" style="display:block;width:100%;max-width:520px;height:180px;object-fit:cover;border-radius:12px;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:20px;">
                  <span style="display:inline-block;background:#ff6b35;color:#fff;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;letter-spacing:0.02em;">WELCOME</span>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#1f2328;">Your night</p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#ff6b35;">starts here.</p>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:20px;color:#656d76;">Welcome to WYA.</p>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;">
                <tr><td style="padding:24px;">
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:25px;font-weight:700;color:#1f2328;">Hello there,</p>
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:22px;color:#656d76;">Confirm your email to activate your account and start discovering events across Kenya.</p>
                  
                  
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
        <tr>
          <td style="background:#ff6b35;border-radius:999px;">
            <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 32px;font-family:Inter,Arial,sans-serif;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">Confirm Email</a>
          </td>
        </tr>
      </table>
                  
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:10px;">
        <tr><td style="padding:16px;">
          <p style="margin:0 0 8px 0;font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:700;color:#ff6b35;">DIDN&#x27;T REQUEST THIS?</p>
          <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:18px;color:#656d76;">If this was not you, ignore this email or contact support.</p>
        </td></tr>
      </table>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:16px;text-align:center;">
                  <p style="margin:0 0 6px 0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">
                    <a href="{{ .SiteURL }}/faq" style="color:#656d76;text-decoration:none;">Support</a>
                    ·
                    <a href="{{ .SiteURL }}/privacy-policy" style="color:#656d76;text-decoration:none;">Privacy</a>
                    ·
                    <a href="{{ .SiteURL }}/terms-of-service" style="color:#656d76;text-decoration:none;">Terms</a>
                  </p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">© 2026 WYA Kenya. All rights reserved.</p>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
',
   'Figma Auth — paste into Supabase Auth Email Templates'),
  ('reset-password', 'auth', 'Reset password', 'Reset your password — WYA',
   '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Password - WYA</title>
</head>
<body style="margin:0;padding:0;background:#f6f8fa;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fa;">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 14px 0;">
              <img src="{{ .SiteURL }}/emails/wya-logo.png" alt="WYA" width="96" height="64" style="display:block;border:0;height:64px;width:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <img src="{{ .SiteURL }}/emails/hero-welcome.jpg" alt="" width="520" height="180" style="display:block;width:100%;max-width:520px;height:180px;object-fit:cover;border-radius:12px;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:20px;">
                  <span style="display:inline-block;background:#ff6b35;color:#fff;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;letter-spacing:0.02em;">SECURITY UPDATE</span>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#1f2328;">Reset your</p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#ff6b35;">password.</p>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:20px;color:#656d76;">Credentials update requested.</p>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;">
                <tr><td style="padding:24px;">
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:25px;font-weight:700;color:#1f2328;">Hello there,</p>
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:22px;color:#656d76;">Create a new password for your WYA account.</p>
                  
                  
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
        <tr>
          <td style="background:#ff6b35;border-radius:999px;">
            <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 32px;font-family:Inter,Arial,sans-serif;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">Reset Password</a>
          </td>
        </tr>
      </table>
                  
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:10px;">
        <tr><td style="padding:16px;">
          <p style="margin:0 0 8px 0;font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:700;color:#ff6b35;">DIDN&#x27;T REQUEST THIS?</p>
          <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:18px;color:#656d76;">If this was not you, ignore this email or contact support.</p>
        </td></tr>
      </table>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:16px;text-align:center;">
                  <p style="margin:0 0 6px 0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">
                    <a href="{{ .SiteURL }}/faq" style="color:#656d76;text-decoration:none;">Support</a>
                    ·
                    <a href="{{ .SiteURL }}/privacy-policy" style="color:#656d76;text-decoration:none;">Privacy</a>
                    ·
                    <a href="{{ .SiteURL }}/terms-of-service" style="color:#656d76;text-decoration:none;">Terms</a>
                  </p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">© 2026 WYA Kenya. All rights reserved.</p>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
',
   'Figma Auth — paste into Supabase Auth Email Templates'),
  ('magic-link', 'auth', 'Magic link', 'Your WYA sign-in link',
   '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sign In - WYA</title>
</head>
<body style="margin:0;padding:0;background:#f6f8fa;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fa;">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 14px 0;">
              <img src="{{ .SiteURL }}/emails/wya-logo.png" alt="WYA" width="96" height="64" style="display:block;border:0;height:64px;width:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <img src="{{ .SiteURL }}/emails/hero-welcome.jpg" alt="" width="520" height="180" style="display:block;width:100%;max-width:520px;height:180px;object-fit:cover;border-radius:12px;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:20px;">
                  <span style="display:inline-block;background:#ff6b35;color:#fff;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;letter-spacing:0.02em;">SECURE SIGN IN</span>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#1f2328;">Your one-click</p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#ff6b35;">sign-in link.</p>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:20px;color:#656d76;">Sign in without a password.</p>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;">
                <tr><td style="padding:24px;">
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:25px;font-weight:700;color:#1f2328;">Hello there,</p>
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:22px;color:#656d76;">Click below to access your dashboard securely.</p>
                  
                  
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
        <tr>
          <td style="background:#ff6b35;border-radius:999px;">
            <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 32px;font-family:Inter,Arial,sans-serif;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">Sign In</a>
          </td>
        </tr>
      </table>
                  
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:10px;">
        <tr><td style="padding:16px;">
          <p style="margin:0 0 8px 0;font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:700;color:#ff6b35;">DIDN&#x27;T REQUEST THIS?</p>
          <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:18px;color:#656d76;">If this was not you, ignore this email or contact support.</p>
        </td></tr>
      </table>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:16px;text-align:center;">
                  <p style="margin:0 0 6px 0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">
                    <a href="{{ .SiteURL }}/faq" style="color:#656d76;text-decoration:none;">Support</a>
                    ·
                    <a href="{{ .SiteURL }}/privacy-policy" style="color:#656d76;text-decoration:none;">Privacy</a>
                    ·
                    <a href="{{ .SiteURL }}/terms-of-service" style="color:#656d76;text-decoration:none;">Terms</a>
                  </p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">© 2026 WYA Kenya. All rights reserved.</p>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
',
   'Figma Auth — paste into Supabase Auth Email Templates'),
  ('change-email', 'auth', 'Change email', 'Confirm your new email — WYA',
   '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirm New Email - WYA</title>
</head>
<body style="margin:0;padding:0;background:#f6f8fa;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fa;">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 14px 0;">
              <img src="{{ .SiteURL }}/emails/wya-logo.png" alt="WYA" width="96" height="64" style="display:block;border:0;height:64px;width:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <img src="{{ .SiteURL }}/emails/hero-welcome.jpg" alt="" width="520" height="180" style="display:block;width:100%;max-width:520px;height:180px;object-fit:cover;border-radius:12px;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:20px;">
                  <span style="display:inline-block;background:#ff6b35;color:#fff;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;letter-spacing:0.02em;">EMAIL UPDATE</span>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#1f2328;">Confirm your</p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#ff6b35;">new email.</p>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:20px;color:#656d76;">Email change requested.</p>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;">
                <tr><td style="padding:24px;">
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:25px;font-weight:700;color:#1f2328;">Hello there,</p>
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:22px;color:#656d76;">Confirm your new login email address to finish updating your account.</p>
                  
                  
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
        <tr>
          <td style="background:#ff6b35;border-radius:999px;">
            <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 32px;font-family:Inter,Arial,sans-serif;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">Confirm Email</a>
          </td>
        </tr>
      </table>
                  
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:10px;">
        <tr><td style="padding:16px;">
          <p style="margin:0 0 8px 0;font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:700;color:#ff6b35;">DIDN&#x27;T REQUEST THIS?</p>
          <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:18px;color:#656d76;">If this was not you, ignore this email or contact support.</p>
        </td></tr>
      </table>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:16px;text-align:center;">
                  <p style="margin:0 0 6px 0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">
                    <a href="{{ .SiteURL }}/faq" style="color:#656d76;text-decoration:none;">Support</a>
                    ·
                    <a href="{{ .SiteURL }}/privacy-policy" style="color:#656d76;text-decoration:none;">Privacy</a>
                    ·
                    <a href="{{ .SiteURL }}/terms-of-service" style="color:#656d76;text-decoration:none;">Terms</a>
                  </p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">© 2026 WYA Kenya. All rights reserved.</p>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
',
   'Figma Auth — paste into Supabase Auth Email Templates'),
  ('invite-user', 'auth', 'Invite user', 'You''re invited to WYA',
   '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You&#x27;re Invited - WYA</title>
</head>
<body style="margin:0;padding:0;background:#f6f8fa;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fa;">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 14px 0;">
              <img src="{{ .SiteURL }}/emails/wya-logo.png" alt="WYA" width="96" height="64" style="display:block;border:0;height:64px;width:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <img src="{{ .SiteURL }}/emails/hero-welcome.jpg" alt="" width="520" height="180" style="display:block;width:100%;max-width:520px;height:180px;object-fit:cover;border-radius:12px;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:20px;">
                  <span style="display:inline-block;background:#ff6b35;color:#fff;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;letter-spacing:0.02em;">INVITATION</span>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#1f2328;">You&#x27;ve been</p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#ff6b35;">invited.</p>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:20px;color:#656d76;">You are invited to WYA.</p>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;">
                <tr><td style="padding:24px;">
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:25px;font-weight:700;color:#1f2328;">Hello there,</p>
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:22px;color:#656d76;">Accept your invitation to create your account and join Kenya&#x27;s event community.</p>
                  
                  
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
        <tr>
          <td style="background:#ff6b35;border-radius:999px;">
            <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 32px;font-family:Inter,Arial,sans-serif;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">Accept Invitation</a>
          </td>
        </tr>
      </table>
                  
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:10px;">
        <tr><td style="padding:16px;">
          <p style="margin:0 0 8px 0;font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:700;color:#ff6b35;">DIDN&#x27;T REQUEST THIS?</p>
          <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:18px;color:#656d76;">If this was not you, ignore this email or contact support.</p>
        </td></tr>
      </table>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:16px;text-align:center;">
                  <p style="margin:0 0 6px 0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">
                    <a href="{{ .SiteURL }}/faq" style="color:#656d76;text-decoration:none;">Support</a>
                    ·
                    <a href="{{ .SiteURL }}/privacy-policy" style="color:#656d76;text-decoration:none;">Privacy</a>
                    ·
                    <a href="{{ .SiteURL }}/terms-of-service" style="color:#656d76;text-decoration:none;">Terms</a>
                  </p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">© 2026 WYA Kenya. All rights reserved.</p>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
',
   'Figma Auth — paste into Supabase Auth Email Templates'),
  ('reauthentication', 'auth', 'Reauthentication', 'Confirm it''s you — WYA',
   '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirm Identity - WYA</title>
</head>
<body style="margin:0;padding:0;background:#f6f8fa;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fa;">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 14px 0;">
              <img src="{{ .SiteURL }}/emails/wya-logo.png" alt="WYA" width="96" height="64" style="display:block;border:0;height:64px;width:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <img src="{{ .SiteURL }}/emails/hero-welcome.jpg" alt="" width="520" height="180" style="display:block;width:100%;max-width:520px;height:180px;object-fit:cover;border-radius:12px;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:20px;">
                  <span style="display:inline-block;background:#ff6b35;color:#fff;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;letter-spacing:0.02em;">REAUTHENTICATION</span>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#1f2328;">Confirm</p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#ff6b35;">it&#x27;s you.</p>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:20px;color:#656d76;">Identity verification required.</p>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;">
                <tr><td style="padding:24px;">
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:25px;font-weight:700;color:#1f2328;">Hello there,</p>
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:22px;color:#656d76;">Confirm your identity to continue with a sensitive action on your account.</p>
                  
                  
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
        <tr>
          <td style="background:#ff6b35;border-radius:999px;">
            <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 32px;font-family:Inter,Arial,sans-serif;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">Confirm Identity</a>
          </td>
        </tr>
      </table>
                  
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:10px;">
        <tr><td style="padding:16px;">
          <p style="margin:0 0 8px 0;font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:700;color:#ff6b35;">DIDN&#x27;T REQUEST THIS?</p>
          <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:18px;color:#656d76;">If this was not you, ignore this email or contact support.</p>
        </td></tr>
      </table>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:16px;text-align:center;">
                  <p style="margin:0 0 6px 0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">
                    <a href="{{ .SiteURL }}/faq" style="color:#656d76;text-decoration:none;">Support</a>
                    ·
                    <a href="{{ .SiteURL }}/privacy-policy" style="color:#656d76;text-decoration:none;">Privacy</a>
                    ·
                    <a href="{{ .SiteURL }}/terms-of-service" style="color:#656d76;text-decoration:none;">Terms</a>
                  </p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">© 2026 WYA Kenya. All rights reserved.</p>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
',
   'Figma Auth — paste into Supabase Auth Email Templates'),
  ('account-deleted', 'transactional', 'Account deleted', 'Your WYA account has been deleted',
   '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WYA</title>
</head>
<body style="margin:0;padding:0;background:#f6f8fa;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fa;">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/wya-logo.png" alt="WYA" width="96" height="64" style="display:block;border:0;height:64px;width:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/hero-welcome.jpg" alt="" width="520" height="220" style="display:block;width:100%;max-width:520px;height:220px;object-fit:cover;border-radius:12px;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:20px;">
                  <span style="display:inline-block;background:#ff6b35;color:#fff;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;letter-spacing:0.02em;">ACCOUNT</span>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#1f2328;">Your account</p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#ff6b35;">was deleted.</p>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:20px;color:#656d76;">Deletion confirmed.</p>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;">
                <tr><td style="padding:24px;">
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:25px;font-weight:700;color:#1f2328;">Hello {{userName}},</p>
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:22px;color:#656d76;">We confirmed deletion of your WYA account. You will no longer receive product emails unless you create a new account.</p>
                  
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;background:#eff2f5;border-radius:10px;">
      <tr><td style="padding:14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Completed</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{completedAt}}</td>
        </tr>
        </table>
      </td></tr>
    </table>
                  
                  
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:10px;">
        <tr><td style="padding:16px;">
          <p style="margin:0 0 8px 0;font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:700;color:#ff6b35;">WAS THIS A MISTAKE?</p>
          <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:18px;color:#656d76;">Contact support@wyakenya.com within 14 days if you did not request this.</p>
        </td></tr>
      </table>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:16px;text-align:center;">
                  <p style="margin:0 0 6px 0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">
                    <a href="https://whereyouat.ke/faq" style="color:#656d76;text-decoration:none;">Support</a>
                    ·
                    <a href="https://whereyouat.ke/privacy-policy" style="color:#656d76;text-decoration:none;">Privacy</a>
                    ·
                    <a href="https://whereyouat.ke/terms-of-service" style="color:#656d76;text-decoration:none;">Terms</a>
                  </p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">© 2026 WYA Kenya. All rights reserved.</p>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
',
   'Figma transactional — live sends use email-templates.ts'),
  ('admin-system-test', 'transactional', 'Admin system test', 'WYA — System test email',
   '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WYA</title>
</head>
<body style="margin:0;padding:0;background:#f6f8fa;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fa;">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/wya-logo.png" alt="WYA" width="96" height="64" style="display:block;border:0;height:64px;width:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/hero-welcome.jpg" alt="" width="520" height="180" style="display:block;width:100%;max-width:520px;height:180px;object-fit:cover;border-radius:12px;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:20px;">
                  <span style="display:inline-block;background:#ff6b35;color:#fff;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;letter-spacing:0.02em;">SYSTEM TEST</span>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#1f2328;">Delivery</p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#ff6b35;">looks good.</p>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:20px;color:#656d76;">Resend connectivity check.</p>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;">
                <tr><td style="padding:24px;">
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:25px;font-weight:700;color:#1f2328;">Hello {{userName}},</p>
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:22px;color:#656d76;">This is a test email from WYA Admin System. If you received it, email delivery is working.</p>
                  
                  
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
        <tr>
          <td style="background:#ff6b35;border-radius:999px;">
            <a href="{{link}}" style="display:inline-block;padding:12px 32px;font-family:Inter,Arial,sans-serif;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">Open Admin</a>
          </td>
        </tr>
      </table>
                  
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:10px;">
        <tr><td style="padding:16px;">
          <p style="margin:0 0 8px 0;font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:700;color:#ff6b35;">NO ACTION NEEDED</p>
          <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:18px;color:#656d76;">This message was triggered manually from the admin panel.</p>
        </td></tr>
      </table>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:16px;text-align:center;">
                  <p style="margin:0 0 6px 0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">
                    <a href="https://whereyouat.ke/faq" style="color:#656d76;text-decoration:none;">Support</a>
                    ·
                    <a href="https://whereyouat.ke/privacy-policy" style="color:#656d76;text-decoration:none;">Privacy</a>
                    ·
                    <a href="https://whereyouat.ke/terms-of-service" style="color:#656d76;text-decoration:none;">Terms</a>
                  </p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">© 2026 WYA Kenya. All rights reserved.</p>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
',
   'Figma transactional — live sends use email-templates.ts'),
  ('ai-digest', 'marketing', 'Weekly AI digest', 'Your weekly WYA digest',
   '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WYA</title>
</head>
<body style="margin:0;padding:0;background:#f6f8fa;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fa;">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/wya-logo.png" alt="WYA" width="96" height="64" style="display:block;border:0;height:64px;width:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/hero-welcome.jpg" alt="" width="520" height="220" style="display:block;width:100%;max-width:520px;height:220px;object-fit:cover;border-radius:12px;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:20px;">
                  <span style="display:inline-block;background:#ff6b35;color:#fff;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;letter-spacing:0.02em;">DIGEST</span>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#1f2328;">Your week</p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#ff6b35;">on WYA.</p>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:20px;color:#656d76;">Personalized picks.</p>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;">
                <tr><td style="padding:24px;">
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:25px;font-weight:700;color:#1f2328;">Hello {{userName}},</p>
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:22px;color:#656d76;">A short digest tailored to you — based on your AI digest preference.</p>
                  
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;background:#eff2f5;border-radius:10px;">
      <tr><td style="padding:14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Nearby</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{nearbyLabel}}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Trending</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{trendingLabel}}</td>
        </tr>
        </table>
      </td></tr>
    </table>
                  
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
        <tr>
          <td style="background:#ff6b35;border-radius:999px;">
            <a href="{{link}}" style="display:inline-block;padding:12px 32px;font-family:Inter,Arial,sans-serif;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">See picks</a>
          </td>
        </tr>
      </table>
                  
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:10px;">
        <tr><td style="padding:16px;">
          <p style="margin:0 0 8px 0;font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:700;color:#ff6b35;">PREFERENCES</p>
          <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:18px;color:#656d76;">Turn this off anytime in Settings → Notifications.</p>
        </td></tr>
      </table>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:16px;text-align:center;">
                  <p style="margin:0 0 6px 0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">
                    <a href="https://whereyouat.ke/faq" style="color:#656d76;text-decoration:none;">Support</a>
                    ·
                    <a href="https://whereyouat.ke/privacy-policy" style="color:#656d76;text-decoration:none;">Privacy</a>
                    ·
                    <a href="https://whereyouat.ke/terms-of-service" style="color:#656d76;text-decoration:none;">Terms</a>
                  </p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">© 2026 WYA Kenya. All rights reserved.</p>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
',
   'Figma transactional — live sends use email-templates.ts'),
  ('announcement', 'transactional', 'Critical announcement', '{{title}}',
   '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WYA</title>
</head>
<body style="margin:0;padding:0;background:#f6f8fa;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fa;">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/wya-logo.png" alt="WYA" width="96" height="64" style="display:block;border:0;height:64px;width:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/hero-welcome.jpg" alt="" width="520" height="220" style="display:block;width:100%;max-width:520px;height:220px;object-fit:cover;border-radius:12px;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:20px;">
                  <span style="display:inline-block;background:#ff6b35;color:#fff;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;letter-spacing:0.02em;">ANNOUNCEMENT</span>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#1f2328;">Important</p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#ff6b35;">platform update.</p>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:20px;color:#656d76;">From the WYA team.</p>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;">
                <tr><td style="padding:24px;">
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:25px;font-weight:700;color:#1f2328;">Hello {{userName}},</p>
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:22px;color:#656d76;">{{message}}</p>
                  
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;background:#eff2f5;border-radius:10px;">
      <tr><td style="padding:14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Topic</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{topicLabel}}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">When</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{whenLabel}}</td>
        </tr>
        </table>
      </td></tr>
    </table>
                  
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
        <tr>
          <td style="background:#ff6b35;border-radius:999px;">
            <a href="{{link}}" style="display:inline-block;padding:12px 32px;font-family:Inter,Arial,sans-serif;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">Read announcement</a>
          </td>
        </tr>
      </table>
                  
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:10px;">
        <tr><td style="padding:16px;">
          <p style="margin:0 0 8px 0;font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:700;color:#ff6b35;">ACTION NEEDED?</p>
          <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:18px;color:#656d76;">No action required unless noted in the announcement.</p>
        </td></tr>
      </table>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:16px;text-align:center;">
                  <p style="margin:0 0 6px 0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">
                    <a href="https://whereyouat.ke/faq" style="color:#656d76;text-decoration:none;">Support</a>
                    ·
                    <a href="https://whereyouat.ke/privacy-policy" style="color:#656d76;text-decoration:none;">Privacy</a>
                    ·
                    <a href="https://whereyouat.ke/terms-of-service" style="color:#656d76;text-decoration:none;">Terms</a>
                  </p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">© 2026 WYA Kenya. All rights reserved.</p>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
',
   'Figma transactional — live sends use email-templates.ts'),
  ('dsar-export-ready', 'transactional', 'DSAR export ready', 'Your data export is ready',
   '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WYA</title>
</head>
<body style="margin:0;padding:0;background:#f6f8fa;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fa;">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/wya-logo.png" alt="WYA" width="96" height="64" style="display:block;border:0;height:64px;width:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/hero-welcome.jpg" alt="" width="520" height="220" style="display:block;width:100%;max-width:520px;height:220px;object-fit:cover;border-radius:12px;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:20px;">
                  <span style="display:inline-block;background:#ff6b35;color:#fff;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;letter-spacing:0.02em;">PRIVACY</span>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#1f2328;">Your export</p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#ff6b35;">is ready.</p>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:20px;color:#656d76;">Secure download.</p>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;">
                <tr><td style="padding:24px;">
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:25px;font-weight:700;color:#1f2328;">Hello {{userName}},</p>
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:22px;color:#656d76;">Your personal data export finished processing. Download it with the secure link below.</p>
                  
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;background:#eff2f5;border-radius:10px;">
      <tr><td style="padding:14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Request</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{requestId}}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Expires</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{expiresLabel}}</td>
        </tr>
        </table>
      </td></tr>
    </table>
                  
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
        <tr>
          <td style="background:#ff6b35;border-radius:999px;">
            <a href="{{link}}" style="display:inline-block;padding:12px 32px;font-family:Inter,Arial,sans-serif;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">Download export</a>
          </td>
        </tr>
      </table>
                  
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:10px;">
        <tr><td style="padding:16px;">
          <p style="margin:0 0 8px 0;font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:700;color:#ff6b35;">PRIVACY</p>
          <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:18px;color:#656d76;">Do not forward this link. It is single-user and time-limited.</p>
        </td></tr>
      </table>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:16px;text-align:center;">
                  <p style="margin:0 0 6px 0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">
                    <a href="https://whereyouat.ke/faq" style="color:#656d76;text-decoration:none;">Support</a>
                    ·
                    <a href="https://whereyouat.ke/privacy-policy" style="color:#656d76;text-decoration:none;">Privacy</a>
                    ·
                    <a href="https://whereyouat.ke/terms-of-service" style="color:#656d76;text-decoration:none;">Terms</a>
                  </p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">© 2026 WYA Kenya. All rights reserved.</p>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
',
   'Figma transactional — live sends use email-templates.ts'),
  ('event-cancelled', 'transactional', 'Event cancelled', 'Cancelled: {{eventTitle}}',
   '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WYA</title>
</head>
<body style="margin:0;padding:0;background:#f6f8fa;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fa;">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/wya-logo.png" alt="WYA" width="96" height="64" style="display:block;border:0;height:64px;width:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/hero-welcome.jpg" alt="" width="520" height="220" style="display:block;width:100%;max-width:520px;height:220px;object-fit:cover;border-radius:12px;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:20px;">
                  <span style="display:inline-block;background:#ff6b35;color:#fff;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;letter-spacing:0.02em;">CANCELLED</span>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#1f2328;">This event</p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#ff6b35;">was cancelled.</p>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:20px;color:#656d76;">Refund in progress.</p>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;">
                <tr><td style="padding:24px;">
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:25px;font-weight:700;color:#1f2328;">Hello {{userName}},</p>
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:22px;color:#656d76;">Unfortunately an event you had tickets for has been cancelled by the organizer.</p>
                  
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;background:#eff2f5;border-radius:10px;">
      <tr><td style="padding:14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Event</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{eventTitle}}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Refund</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{refundLabel}}</td>
        </tr>
        </table>
      </td></tr>
    </table>
                  
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
        <tr>
          <td style="background:#ff6b35;border-radius:999px;">
            <a href="{{link}}" style="display:inline-block;padding:12px 32px;font-family:Inter,Arial,sans-serif;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">View refund</a>
          </td>
        </tr>
      </table>
                  
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:10px;">
        <tr><td style="padding:16px;">
          <p style="margin:0 0 8px 0;font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:700;color:#ff6b35;">NEED HELP?</p>
          <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:18px;color:#656d76;">Contact support if you do not see funds within 5 business days.</p>
        </td></tr>
      </table>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:16px;text-align:center;">
                  <p style="margin:0 0 6px 0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">
                    <a href="https://whereyouat.ke/faq" style="color:#656d76;text-decoration:none;">Support</a>
                    ·
                    <a href="https://whereyouat.ke/privacy-policy" style="color:#656d76;text-decoration:none;">Privacy</a>
                    ·
                    <a href="https://whereyouat.ke/terms-of-service" style="color:#656d76;text-decoration:none;">Terms</a>
                  </p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">© 2026 WYA Kenya. All rights reserved.</p>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
',
   'Figma transactional — live sends use email-templates.ts'),
  ('event-reminder', 'transactional', 'Event reminder', 'Reminder: {{eventTitle}}',
   '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WYA</title>
</head>
<body style="margin:0;padding:0;background:#f6f8fa;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fa;">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/wya-logo.png" alt="WYA" width="96" height="64" style="display:block;border:0;height:64px;width:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/hero-welcome.jpg" alt="" width="520" height="220" style="display:block;width:100%;max-width:520px;height:220px;object-fit:cover;border-radius:12px;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:20px;">
                  <span style="display:inline-block;background:#ff6b35;color:#fff;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;letter-spacing:0.02em;">REMINDER</span>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#1f2328;">Tomorrow night</p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#ff6b35;">you are going.</p>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:20px;color:#656d76;">T−24h reminder.</p>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;">
                <tr><td style="padding:24px;">
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:25px;font-weight:700;color:#1f2328;">Hello {{userName}},</p>
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:22px;color:#656d76;">Your event starts in about 24 hours. Arrive early with your QR ticket ready.</p>
                  
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;background:#eff2f5;border-radius:10px;">
      <tr><td style="padding:14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Event</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{eventTitle}}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">When</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{eventWhen}}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Where</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{eventWhere}}</td>
        </tr>
        </table>
      </td></tr>
    </table>
                  
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
        <tr>
          <td style="background:#ff6b35;border-radius:999px;">
            <a href="{{link}}" style="display:inline-block;padding:12px 32px;font-family:Inter,Arial,sans-serif;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">Open event</a>
          </td>
        </tr>
      </table>
                  
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:16px;text-align:center;">
                  <p style="margin:0 0 6px 0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">
                    <a href="https://whereyouat.ke/faq" style="color:#656d76;text-decoration:none;">Support</a>
                    ·
                    <a href="https://whereyouat.ke/privacy-policy" style="color:#656d76;text-decoration:none;">Privacy</a>
                    ·
                    <a href="https://whereyouat.ke/terms-of-service" style="color:#656d76;text-decoration:none;">Terms</a>
                  </p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">© 2026 WYA Kenya. All rights reserved.</p>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
',
   'Figma transactional — live sends use email-templates.ts'),
  ('event-updated', 'transactional', 'Event updated', 'Update: {{eventTitle}}',
   '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WYA</title>
</head>
<body style="margin:0;padding:0;background:#f6f8fa;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fa;">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/wya-logo.png" alt="WYA" width="96" height="64" style="display:block;border:0;height:64px;width:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/hero-welcome.jpg" alt="" width="520" height="220" style="display:block;width:100%;max-width:520px;height:220px;object-fit:cover;border-radius:12px;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:20px;">
                  <span style="display:inline-block;background:#ff6b35;color:#fff;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;letter-spacing:0.02em;">UPDATE</span>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#1f2328;">This event</p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#ff6b35;">was updated.</p>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:20px;color:#656d76;">Details changed.</p>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;">
                <tr><td style="padding:24px;">
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:25px;font-weight:700;color:#1f2328;">Hello {{userName}},</p>
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:22px;color:#656d76;">An organizer changed details for an event you hold tickets for. Review the new info.</p>
                  
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;background:#eff2f5;border-radius:10px;">
      <tr><td style="padding:14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Event</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{eventTitle}}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Was</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{wasLabel}}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Now</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{nowLabel}}</td>
        </tr>
        </table>
      </td></tr>
    </table>
                  
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
        <tr>
          <td style="background:#ff6b35;border-radius:999px;">
            <a href="{{link}}" style="display:inline-block;padding:12px 32px;font-family:Inter,Arial,sans-serif;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">See changes</a>
          </td>
        </tr>
      </table>
                  
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:10px;">
        <tr><td style="padding:16px;">
          <p style="margin:0 0 8px 0;font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:700;color:#ff6b35;">YOUR TICKETS</p>
          <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:18px;color:#656d76;">Existing tickets remain valid for the updated time and venue.</p>
        </td></tr>
      </table>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:16px;text-align:center;">
                  <p style="margin:0 0 6px 0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">
                    <a href="https://whereyouat.ke/faq" style="color:#656d76;text-decoration:none;">Support</a>
                    ·
                    <a href="https://whereyouat.ke/privacy-policy" style="color:#656d76;text-decoration:none;">Privacy</a>
                    ·
                    <a href="https://whereyouat.ke/terms-of-service" style="color:#656d76;text-decoration:none;">Terms</a>
                  </p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">© 2026 WYA Kenya. All rights reserved.</p>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
',
   'Figma transactional — live sends use email-templates.ts'),
  ('marketplace-buyer-receipt', 'transactional', 'Marketplace transfer', 'Marketplace purchase confirmed',
   '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WYA</title>
</head>
<body style="margin:0;padding:0;background:#f6f8fa;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fa;">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/wya-logo.png" alt="WYA" width="96" height="64" style="display:block;border:0;height:64px;width:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/hero-welcome.jpg" alt="" width="520" height="220" style="display:block;width:100%;max-width:520px;height:220px;object-fit:cover;border-radius:12px;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:20px;">
                  <span style="display:inline-block;background:#ff6b35;color:#fff;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;letter-spacing:0.02em;">TRANSFER</span>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#1f2328;">Transfer</p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#ff6b35;">complete.</p>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:20px;color:#656d76;">Tickets are yours.</p>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;">
                <tr><td style="padding:24px;">
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:25px;font-weight:700;color:#1f2328;">Hello {{userName}},</p>
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:22px;color:#656d76;">Your marketplace transfer or gift claim succeeded. Tickets are now in your wallet.</p>
                  
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;background:#eff2f5;border-radius:10px;">
      <tr><td style="padding:14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Event</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{eventTitle}}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Tickets</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{ticketSummary}}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Type</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{transferType}}</td>
        </tr>
        </table>
      </td></tr>
    </table>
                  
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
        <tr>
          <td style="background:#ff6b35;border-radius:999px;">
            <a href="{{link}}" style="display:inline-block;padding:12px 32px;font-family:Inter,Arial,sans-serif;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">View tickets</a>
          </td>
        </tr>
      </table>
                  
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:16px;text-align:center;">
                  <p style="margin:0 0 6px 0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">
                    <a href="https://whereyouat.ke/faq" style="color:#656d76;text-decoration:none;">Support</a>
                    ·
                    <a href="https://whereyouat.ke/privacy-policy" style="color:#656d76;text-decoration:none;">Privacy</a>
                    ·
                    <a href="https://whereyouat.ke/terms-of-service" style="color:#656d76;text-decoration:none;">Terms</a>
                  </p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">© 2026 WYA Kenya. All rights reserved.</p>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
',
   'Figma transactional — live sends use email-templates.ts'),
  ('marketplace-seller-sold', 'transactional', 'Listing sold', 'Your listing sold',
   '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WYA</title>
</head>
<body style="margin:0;padding:0;background:#f6f8fa;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fa;">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/wya-logo.png" alt="WYA" width="96" height="64" style="display:block;border:0;height:64px;width:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/hero-welcome.jpg" alt="" width="520" height="220" style="display:block;width:100%;max-width:520px;height:220px;object-fit:cover;border-radius:12px;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:20px;">
                  <span style="display:inline-block;background:#ff6b35;color:#fff;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;letter-spacing:0.02em;">SALE</span>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#1f2328;">Your listing</p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#ff6b35;">sold.</p>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:20px;color:#656d76;">Payout pending.</p>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;">
                <tr><td style="padding:24px;">
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:25px;font-weight:700;color:#1f2328;">Hello {{userName}},</p>
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:22px;color:#656d76;">Someone bought or claimed your marketplace listing.</p>
                  
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;background:#eff2f5;border-radius:10px;">
      <tr><td style="padding:14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Listing</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{listingLabel}}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Amount</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{amountPaid}}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Payout</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{payoutLabel}}</td>
        </tr>
        </table>
      </td></tr>
    </table>
                  
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
        <tr>
          <td style="background:#ff6b35;border-radius:999px;">
            <a href="{{link}}" style="display:inline-block;padding:12px 32px;font-family:Inter,Arial,sans-serif;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">View sale</a>
          </td>
        </tr>
      </table>
                  
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:16px;text-align:center;">
                  <p style="margin:0 0 6px 0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">
                    <a href="https://whereyouat.ke/faq" style="color:#656d76;text-decoration:none;">Support</a>
                    ·
                    <a href="https://whereyouat.ke/privacy-policy" style="color:#656d76;text-decoration:none;">Privacy</a>
                    ·
                    <a href="https://whereyouat.ke/terms-of-service" style="color:#656d76;text-decoration:none;">Terms</a>
                  </p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">© 2026 WYA Kenya. All rights reserved.</p>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
',
   'Figma transactional — live sends use email-templates.ts'),
  ('media-share', 'transactional', 'Event media share', 'Media gallery: {{eventTitle}}',
   '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WYA</title>
</head>
<body style="margin:0;padding:0;background:#f6f8fa;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fa;">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/wya-logo.png" alt="WYA" width="96" height="64" style="display:block;border:0;height:64px;width:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/hero-welcome.jpg" alt="" width="520" height="220" style="display:block;width:100%;max-width:520px;height:220px;object-fit:cover;border-radius:12px;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:20px;">
                  <span style="display:inline-block;background:#ff6b35;color:#fff;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;letter-spacing:0.02em;">GALLERY</span>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#1f2328;">Fresh media</p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#ff6b35;">shared with you.</p>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:20px;color:#656d76;">Review the gallery.</p>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;">
                <tr><td style="padding:24px;">
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:25px;font-weight:700;color:#1f2328;">Hello {{userName}},</p>
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:22px;color:#656d76;">An admin shared event media with you. Open the gallery to review photos and clips.</p>
                  
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;background:#eff2f5;border-radius:10px;">
      <tr><td style="padding:14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Event</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{eventTitle}}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Items</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{mediaSummary}}</td>
        </tr>
        </table>
      </td></tr>
    </table>
                  
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
        <tr>
          <td style="background:#ff6b35;border-radius:999px;">
            <a href="{{link}}" style="display:inline-block;padding:12px 32px;font-family:Inter,Arial,sans-serif;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">Open gallery</a>
          </td>
        </tr>
      </table>
                  
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:16px;text-align:center;">
                  <p style="margin:0 0 6px 0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">
                    <a href="https://whereyouat.ke/faq" style="color:#656d76;text-decoration:none;">Support</a>
                    ·
                    <a href="https://whereyouat.ke/privacy-policy" style="color:#656d76;text-decoration:none;">Privacy</a>
                    ·
                    <a href="https://whereyouat.ke/terms-of-service" style="color:#656d76;text-decoration:none;">Terms</a>
                  </p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">© 2026 WYA Kenya. All rights reserved.</p>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
',
   'Figma transactional — live sends use email-templates.ts'),
  ('message-digest', 'transactional', 'DM unread digest', 'You have unread messages',
   '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WYA</title>
</head>
<body style="margin:0;padding:0;background:#f6f8fa;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fa;">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/wya-logo.png" alt="WYA" width="96" height="64" style="display:block;border:0;height:64px;width:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/hero-welcome.jpg" alt="" width="520" height="220" style="display:block;width:100%;max-width:520px;height:220px;object-fit:cover;border-radius:12px;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:20px;">
                  <span style="display:inline-block;background:#ff6b35;color:#fff;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;letter-spacing:0.02em;">MESSAGES</span>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#1f2328;">You have</p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#ff6b35;">unread chats.</p>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:20px;color:#656d76;">Catch up on WYA.</p>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;">
                <tr><td style="padding:24px;">
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:25px;font-weight:700;color:#1f2328;">Hello {{userName}},</p>
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:22px;color:#656d76;">While you were away, people messaged you. Open the app so you do not miss plans.</p>
                  
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;background:#eff2f5;border-radius:10px;">
      <tr><td style="padding:14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Unread</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{unreadLabel}}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Latest</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{latestLabel}}</td>
        </tr>
        </table>
      </td></tr>
    </table>
                  
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
        <tr>
          <td style="background:#ff6b35;border-radius:999px;">
            <a href="{{link}}" style="display:inline-block;padding:12px 32px;font-family:Inter,Arial,sans-serif;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">Open messages</a>
          </td>
        </tr>
      </table>
                  
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:10px;">
        <tr><td style="padding:16px;">
          <p style="margin:0 0 8px 0;font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:700;color:#ff6b35;">PREFERENCES</p>
          <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:18px;color:#656d76;">Digest emails respect your notification settings.</p>
        </td></tr>
      </table>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:16px;text-align:center;">
                  <p style="margin:0 0 6px 0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">
                    <a href="https://whereyouat.ke/faq" style="color:#656d76;text-decoration:none;">Support</a>
                    ·
                    <a href="https://whereyouat.ke/privacy-policy" style="color:#656d76;text-decoration:none;">Privacy</a>
                    ·
                    <a href="https://whereyouat.ke/terms-of-service" style="color:#656d76;text-decoration:none;">Terms</a>
                  </p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">© 2026 WYA Kenya. All rights reserved.</p>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
',
   'Figma transactional — live sends use email-templates.ts'),
  ('new-event', 'transactional', 'New event near you', 'New event: {{eventTitle}}',
   '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WYA</title>
</head>
<body style="margin:0;padding:0;background:#f6f8fa;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fa;">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/wya-logo.png" alt="WYA" width="96" height="64" style="display:block;border:0;height:64px;width:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/hero-welcome.jpg" alt="" width="520" height="220" style="display:block;width:100%;max-width:520px;height:220px;object-fit:cover;border-radius:12px;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:20px;">
                  <span style="display:inline-block;background:#ff6b35;color:#fff;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;letter-spacing:0.02em;">FOR YOU</span>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#1f2328;">New event</p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#ff6b35;">near you.</p>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:20px;color:#656d76;">Matches your interests.</p>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;">
                <tr><td style="padding:24px;">
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:25px;font-weight:700;color:#1f2328;">Hello {{userName}},</p>
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:22px;color:#656d76;">A new event near you matches your vibe. Check it before tickets sell out.</p>
                  
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;background:#eff2f5;border-radius:10px;">
      <tr><td style="padding:14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Event</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{eventTitle}}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">When</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{eventWhen}}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Area</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{eventArea}}</td>
        </tr>
        </table>
      </td></tr>
    </table>
                  
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
        <tr>
          <td style="background:#ff6b35;border-radius:999px;">
            <a href="{{link}}" style="display:inline-block;padding:12px 32px;font-family:Inter,Arial,sans-serif;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">Explore event</a>
          </td>
        </tr>
      </table>
                  
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:16px;text-align:center;">
                  <p style="margin:0 0 6px 0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">
                    <a href="https://whereyouat.ke/faq" style="color:#656d76;text-decoration:none;">Support</a>
                    ·
                    <a href="https://whereyouat.ke/privacy-policy" style="color:#656d76;text-decoration:none;">Privacy</a>
                    ·
                    <a href="https://whereyouat.ke/terms-of-service" style="color:#656d76;text-decoration:none;">Terms</a>
                  </p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">© 2026 WYA Kenya. All rights reserved.</p>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
',
   'Figma transactional — live sends use email-templates.ts'),
  ('newsletter', 'marketing', 'Newsletter', 'This week''s pulse — WYA',
   '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WYA</title>
</head>
<body style="margin:0;padding:0;background:#f6f8fa;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fa;">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/wya-logo.png" alt="WYA" width="96" height="64" style="display:block;border:0;height:64px;width:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/hero-welcome.jpg" alt="" width="520" height="220" style="display:block;width:100%;max-width:520px;height:220px;object-fit:cover;border-radius:12px;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:20px;">
                  <span style="display:inline-block;background:#ff6b35;color:#fff;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;letter-spacing:0.02em;">NEWSLETTER</span>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#1f2328;">This week&#x27;s</p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#ff6b35;">pulse.</p>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:20px;color:#656d76;">For subscribers only.</p>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;">
                <tr><td style="padding:24px;">
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:25px;font-weight:700;color:#1f2328;">Hello {{userName}},</p>
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:22px;color:#656d76;">Hand-picked nights, new drops, and community highlights for people with marketing consent.</p>
                  
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;background:#eff2f5;border-radius:10px;">
      <tr><td style="padding:14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Hot</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{hotLabel}}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">New</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{newLabel}}</td>
        </tr>
        </table>
      </td></tr>
    </table>
                  
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
        <tr>
          <td style="background:#ff6b35;border-radius:999px;">
            <a href="{{link}}" style="display:inline-block;padding:12px 32px;font-family:Inter,Arial,sans-serif;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">Browse this week</a>
          </td>
        </tr>
      </table>
                  
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:10px;">
        <tr><td style="padding:16px;">
          <p style="margin:0 0 8px 0;font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:700;color:#ff6b35;">UNSUBSCRIBE ANYTIME</p>
          <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:18px;color:#656d76;">Manage preferences from Settings or the unsubscribe link in live sends.</p>
        </td></tr>
      </table>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:16px;text-align:center;">
                  <p style="margin:0 0 6px 0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">
                    <a href="https://whereyouat.ke/faq" style="color:#656d76;text-decoration:none;">Support</a>
                    ·
                    <a href="https://whereyouat.ke/privacy-policy" style="color:#656d76;text-decoration:none;">Privacy</a>
                    ·
                    <a href="https://whereyouat.ke/terms-of-service" style="color:#656d76;text-decoration:none;">Terms</a>
                  </p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">© 2026 WYA Kenya. All rights reserved.</p>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
',
   'Figma transactional — live sends use email-templates.ts'),
  ('organizer-assigned', 'transactional', 'Organizer assigned', 'You''re organizing {{eventTitle}}',
   '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WYA</title>
</head>
<body style="margin:0;padding:0;background:#f6f8fa;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fa;">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/wya-logo.png" alt="WYA" width="96" height="64" style="display:block;border:0;height:64px;width:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/hero-welcome.jpg" alt="" width="520" height="220" style="display:block;width:100%;max-width:520px;height:220px;object-fit:cover;border-radius:12px;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:20px;">
                  <span style="display:inline-block;background:#ff6b35;color:#fff;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;letter-spacing:0.02em;">ORGANIZER</span>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#1f2328;">You&#x27;re now</p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#ff6b35;">the organizer.</p>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:20px;color:#656d76;">New permissions.</p>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;">
                <tr><td style="padding:24px;">
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:25px;font-weight:700;color:#1f2328;">Hello {{userName}},</p>
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:22px;color:#656d76;">An admin assigned you as organizer. You can manage tickets, media, and updates.</p>
                  
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;background:#eff2f5;border-radius:10px;">
      <tr><td style="padding:14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Event</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{eventTitle}}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Role</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">Organizer</td>
        </tr>
        </table>
      </td></tr>
    </table>
                  
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
        <tr>
          <td style="background:#ff6b35;border-radius:999px;">
            <a href="{{link}}" style="display:inline-block;padding:12px 32px;font-family:Inter,Arial,sans-serif;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">Open tools</a>
          </td>
        </tr>
      </table>
                  
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:16px;text-align:center;">
                  <p style="margin:0 0 6px 0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">
                    <a href="https://whereyouat.ke/faq" style="color:#656d76;text-decoration:none;">Support</a>
                    ·
                    <a href="https://whereyouat.ke/privacy-policy" style="color:#656d76;text-decoration:none;">Privacy</a>
                    ·
                    <a href="https://whereyouat.ke/terms-of-service" style="color:#656d76;text-decoration:none;">Terms</a>
                  </p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">© 2026 WYA Kenya. All rights reserved.</p>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
',
   'Figma transactional — live sends use email-templates.ts'),
  ('proposal-approved', 'transactional', 'Proposal approved', 'Approved: {{eventTitle}}',
   '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WYA</title>
</head>
<body style="margin:0;padding:0;background:#f6f8fa;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fa;">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/wya-logo.png" alt="WYA" width="96" height="64" style="display:block;border:0;height:64px;width:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/hero-welcome.jpg" alt="" width="520" height="220" style="display:block;width:100%;max-width:520px;height:220px;object-fit:cover;border-radius:12px;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:20px;">
                  <span style="display:inline-block;background:#ff6b35;color:#fff;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;letter-spacing:0.02em;">APPROVED</span>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#1f2328;">Your proposal</p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#ff6b35;">was approved.</p>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:20px;color:#656d76;">Ready to publish.</p>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;">
                <tr><td style="padding:24px;">
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:25px;font-weight:700;color:#1f2328;">Hello {{userName}},</p>
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:22px;color:#656d76;">The WYA team approved your event proposal. Finish setup and go live.</p>
                  
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;background:#eff2f5;border-radius:10px;">
      <tr><td style="padding:14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Proposal</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{eventTitle}}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Next</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">Add tickets &amp; publish</td>
        </tr>
        </table>
      </td></tr>
    </table>
                  
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
        <tr>
          <td style="background:#ff6b35;border-radius:999px;">
            <a href="{{link}}" style="display:inline-block;padding:12px 32px;font-family:Inter,Arial,sans-serif;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">Open proposal</a>
          </td>
        </tr>
      </table>
                  
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:16px;text-align:center;">
                  <p style="margin:0 0 6px 0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">
                    <a href="https://whereyouat.ke/faq" style="color:#656d76;text-decoration:none;">Support</a>
                    ·
                    <a href="https://whereyouat.ke/privacy-policy" style="color:#656d76;text-decoration:none;">Privacy</a>
                    ·
                    <a href="https://whereyouat.ke/terms-of-service" style="color:#656d76;text-decoration:none;">Terms</a>
                  </p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">© 2026 WYA Kenya. All rights reserved.</p>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
',
   'Figma transactional — live sends use email-templates.ts'),
  ('proposal-rejected', 'transactional', 'Proposal rejected', 'Update on your proposal: {{eventTitle}}',
   '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WYA</title>
</head>
<body style="margin:0;padding:0;background:#f6f8fa;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fa;">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/wya-logo.png" alt="WYA" width="96" height="64" style="display:block;border:0;height:64px;width:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/hero-welcome.jpg" alt="" width="520" height="220" style="display:block;width:100%;max-width:520px;height:220px;object-fit:cover;border-radius:12px;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:20px;">
                  <span style="display:inline-block;background:#ff6b35;color:#fff;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;letter-spacing:0.02em;">NEEDS CHANGES</span>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#1f2328;">Your proposal</p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#ff6b35;">needs work.</p>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:20px;color:#656d76;">Review feedback.</p>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;">
                <tr><td style="padding:24px;">
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:25px;font-weight:700;color:#1f2328;">Hello {{userName}},</p>
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:22px;color:#656d76;">We cannot approve this proposal yet. See notes and resubmit when ready.</p>
                  
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;background:#eff2f5;border-radius:10px;">
      <tr><td style="padding:14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Proposal</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{eventTitle}}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Reason</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{reasonLabel}}</td>
        </tr>
        </table>
      </td></tr>
    </table>
                  
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
        <tr>
          <td style="background:#ff6b35;border-radius:999px;">
            <a href="{{link}}" style="display:inline-block;padding:12px 32px;font-family:Inter,Arial,sans-serif;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">Review feedback</a>
          </td>
        </tr>
      </table>
                  
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:10px;">
        <tr><td style="padding:16px;">
          <p style="margin:0 0 8px 0;font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:700;color:#ff6b35;">YOU CAN RESUBMIT</p>
          <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:18px;color:#656d76;">Fix the issues noted by admin and submit again from Request Event.</p>
        </td></tr>
      </table>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:16px;text-align:center;">
                  <p style="margin:0 0 6px 0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">
                    <a href="https://whereyouat.ke/faq" style="color:#656d76;text-decoration:none;">Support</a>
                    ·
                    <a href="https://whereyouat.ke/privacy-policy" style="color:#656d76;text-decoration:none;">Privacy</a>
                    ·
                    <a href="https://whereyouat.ke/terms-of-service" style="color:#656d76;text-decoration:none;">Terms</a>
                  </p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">© 2026 WYA Kenya. All rights reserved.</p>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
',
   'Figma transactional — live sends use email-templates.ts'),
  ('proposal-submitted', 'transactional', 'Proposal submitted', 'We received your event proposal',
   '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WYA</title>
</head>
<body style="margin:0;padding:0;background:#f6f8fa;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fa;">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/wya-logo.png" alt="WYA" width="96" height="64" style="display:block;border:0;height:64px;width:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/hero-welcome.jpg" alt="" width="520" height="220" style="display:block;width:100%;max-width:520px;height:220px;object-fit:cover;border-radius:12px;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:20px;">
                  <span style="display:inline-block;background:#ff6b35;color:#fff;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;letter-spacing:0.02em;">RECEIVED</span>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#1f2328;">We got</p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#ff6b35;">your proposal.</p>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:20px;color:#656d76;">In review.</p>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;">
                <tr><td style="padding:24px;">
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:25px;font-weight:700;color:#1f2328;">Hello {{userName}},</p>
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:22px;color:#656d76;">Thanks for submitting. We will email you when there is a decision.</p>
                  
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;background:#eff2f5;border-radius:10px;">
      <tr><td style="padding:14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Proposal</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{eventTitle}}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Status</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">In review</td>
        </tr>
        </table>
      </td></tr>
    </table>
                  
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
        <tr>
          <td style="background:#ff6b35;border-radius:999px;">
            <a href="{{link}}" style="display:inline-block;padding:12px 32px;font-family:Inter,Arial,sans-serif;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">Track proposal</a>
          </td>
        </tr>
      </table>
                  
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:16px;text-align:center;">
                  <p style="margin:0 0 6px 0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">
                    <a href="https://whereyouat.ke/faq" style="color:#656d76;text-decoration:none;">Support</a>
                    ·
                    <a href="https://whereyouat.ke/privacy-policy" style="color:#656d76;text-decoration:none;">Privacy</a>
                    ·
                    <a href="https://whereyouat.ke/terms-of-service" style="color:#656d76;text-decoration:none;">Terms</a>
                  </p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">© 2026 WYA Kenya. All rights reserved.</p>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
',
   'Figma transactional — live sends use email-templates.ts'),
  ('ticket-confirmation', 'transactional', 'Ticket confirmation', 'Your tickets for {{eventTitle}}',
   '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WYA</title>
</head>
<body style="margin:0;padding:0;background:#f6f8fa;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fa;">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/wya-logo.png" alt="WYA" width="96" height="64" style="display:block;border:0;height:64px;width:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/hero-welcome.jpg" alt="" width="520" height="220" style="display:block;width:100%;max-width:520px;height:220px;object-fit:cover;border-radius:12px;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:20px;">
                  <span style="display:inline-block;background:#ff6b35;color:#fff;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;letter-spacing:0.02em;">TICKETS</span>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#1f2328;">Your tickets</p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#ff6b35;">are confirmed.</p>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:20px;color:#656d76;">Payment successful.</p>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;">
                <tr><td style="padding:24px;">
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:25px;font-weight:700;color:#1f2328;">Hello {{userName}},</p>
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:22px;color:#656d76;">Thanks for buying with WYA. Your tickets are ready in the app.</p>
                  
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;background:#eff2f5;border-radius:10px;">
      <tr><td style="padding:14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Event</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{eventTitle}}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Date</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{eventWhen}}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Tickets</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{ticketSummary}}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Paid</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{amountPaid}}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#656d76;width:100px;vertical-align:top;">Order</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1f2328;font-weight:600;">{{orderId}}</td>
        </tr>
        </table>
      </td></tr>
    </table>
                  
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
        <tr>
          <td style="background:#ff6b35;border-radius:999px;">
            <a href="{{link}}" style="display:inline-block;padding:12px 32px;font-family:Inter,Arial,sans-serif;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">View tickets</a>
          </td>
        </tr>
      </table>
                  
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:10px;">
        <tr><td style="padding:16px;">
          <p style="margin:0 0 8px 0;font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:700;color:#ff6b35;">AT THE DOOR</p>
          <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:18px;color:#656d76;">Show your QR code from the WYA app. Keep this email for your records.</p>
        </td></tr>
      </table>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:16px;text-align:center;">
                  <p style="margin:0 0 6px 0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">
                    <a href="https://whereyouat.ke/faq" style="color:#656d76;text-decoration:none;">Support</a>
                    ·
                    <a href="https://whereyouat.ke/privacy-policy" style="color:#656d76;text-decoration:none;">Privacy</a>
                    ·
                    <a href="https://whereyouat.ke/terms-of-service" style="color:#656d76;text-decoration:none;">Terms</a>
                  </p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">© 2026 WYA Kenya. All rights reserved.</p>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
',
   'Figma transactional — live sends use email-templates.ts'),
  ('welcome', 'transactional', 'Welcome', 'Welcome to WYA',
   '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WYA</title>
</head>
<body style="margin:0;padding:0;background:#f6f8fa;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fa;">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/wya-logo.png" alt="WYA" width="96" height="64" style="display:block;border:0;height:64px;width:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <img src="https://whereyouat.ke/emails/hero-welcome.jpg" alt="" width="520" height="180" style="display:block;width:100%;max-width:520px;height:180px;object-fit:cover;border-radius:12px;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:20px;">
                  <span style="display:inline-block;background:#ff6b35;color:#fff;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;letter-spacing:0.02em;">WELCOME</span>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#1f2328;">Your night</p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:#ff6b35;">starts here.</p>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:20px;color:#656d76;">Welcome to WYA.</p>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;">
                <tr><td style="padding:24px;">
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:25px;font-weight:700;color:#1f2328;">Hello {{userName}},</p>
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:22px;color:#656d76;">Your profile is ready — discover events across Kenya.</p>
                  
                  
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
        <tr>
          <td style="background:#ff6b35;border-radius:999px;">
            <a href="{{link}}" style="display:inline-block;padding:12px 32px;font-family:Inter,Arial,sans-serif;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">Explore</a>
          </td>
        </tr>
      </table>
                  
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2f5;border-radius:12px;">
                <tr><td style="padding:16px;text-align:center;">
                  <p style="margin:0 0 6px 0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">
                    <a href="https://whereyouat.ke/faq" style="color:#656d76;text-decoration:none;">Support</a>
                    ·
                    <a href="https://whereyouat.ke/privacy-policy" style="color:#656d76;text-decoration:none;">Privacy</a>
                    ·
                    <a href="https://whereyouat.ke/terms-of-service" style="color:#656d76;text-decoration:none;">Terms</a>
                  </p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:11px;color:#656d76;">© 2026 WYA Kenya. All rights reserved.</p>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
',
   'Figma transactional — live sends use email-templates.ts')
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  name = EXCLUDED.name,
  subject = EXCLUDED.subject,
  html = EXCLUDED.html,
  description = EXCLUDED.description,
  updated_at = now();
