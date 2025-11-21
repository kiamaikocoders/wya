# WYA Email Templates

This directory contains HTML email templates for WYA authentication and user communication flows. All templates are designed to match the WYA brand identity with a dark theme, orange accents, and modern styling.

## Brand Colors

- **Primary Background**: `#181410` (kenya-dark)
- **Card Background**: `#211a14` (dark gradient)
- **Primary Accent**: `#FF8000` (kenya-orange)
- **Gradient Accent**: `linear-gradient(135deg, #FF8000 0%, #FFA94D 100%)`
- **Text Primary**: `#ffffff` (white)
- **Text Secondary**: `#BCAB9A` (kenya-brown-light)

## Templates

### 1. `confirm-signup.html`
**Purpose**: Email verification after user signup  
**Variables**: `{{ .ConfirmationURL }}`  
**Expiration**: 24 hours

### 2. `reset-password.html`
**Purpose**: Password reset request  
**Variables**: `{{ .ConfirmationURL }}`  
**Expiration**: 1 hour

### 3. `magic-link.html`
**Purpose**: Passwordless sign-in via magic link  
**Variables**: `{{ .ConfirmationURL }}`  
**Expiration**: 1 hour

### 4. `change-email.html`
**Purpose**: Email address change confirmation  
**Variables**: `{{ .ConfirmationURL }}`  
**Expiration**: 24 hours

### 5. `invite-user.html`
**Purpose**: User invitation to join WYA  
**Variables**: `{{ .ConfirmationURL }}`  
**Expiration**: 7 days

### 6. `reauthentication.html`
**Purpose**: Identity verification for sensitive actions  
**Variables**: `{{ .ConfirmationURL }}`  
**Expiration**: 15 minutes

## Supabase Configuration

To use these templates with Supabase:

1. Go to your Supabase Dashboard → Authentication → Email Templates
2. For each template type, paste the corresponding HTML from this directory
3. Replace `{{ .ConfirmationURL }}` with Supabase's template variable: `{{ .ConfirmationURL }}` (Supabase uses Go template syntax)

### Supabase Template Variables

Supabase provides these variables:
- `{{ .ConfirmationURL }}` - The confirmation/action URL
- `{{ .Email }}` - User's email address
- `{{ .Token }}` - The confirmation token (if needed)
- `{{ .TokenHash }}` - Hashed token (if needed)
- `{{ .SiteURL }}` - Your site URL
- `{{ .RedirectTo }}` - Redirect URL after confirmation

## Design Features

- **Mobile-responsive**: Works on all screen sizes
- **Dark theme**: Matches WYA's brand identity
- **Accessible**: High contrast ratios for readability
- **Email client compatible**: Tested for major email clients (Gmail, Outlook, Apple Mail)
- **Brand consistent**: Uses WYA colors, fonts, and styling

## Customization

To customize these templates:

1. Update colors in the inline styles
2. Modify text content to match your tone
3. Adjust expiration times in the copy (not the actual expiration, which is set in Supabase)
4. Add your logo or branding elements if needed

## Testing

Before deploying:

1. Test in multiple email clients (Gmail, Outlook, Apple Mail, etc.)
2. Verify mobile responsiveness
3. Check that all links work correctly
4. Ensure proper rendering in dark mode email clients
5. Test with actual Supabase template variables

## Notes

- All templates use inline CSS for maximum email client compatibility
- Tables are used for layout (email client standard)
- MSO (Microsoft Outlook) conditional comments are included
- Links are styled with the orange accent color for brand consistency
- Security messages are prominently displayed where appropriate

