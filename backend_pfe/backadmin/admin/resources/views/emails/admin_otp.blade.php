<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code de vérification</title>
</head>
<body style="margin:0;padding:0;background:#f0fffe;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fffe;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,168,150,0.12);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0ae1cc 0%,#00A896 100%);padding:36px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;color:rgba(255,255,255,0.8);letter-spacing:2px;text-transform:uppercase;">Thunder Express</p>
              <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;">Vérification de connexion</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 24px;">
              <p style="margin:0 0 12px;font-size:15px;color:#374151;">Bonjour <strong>{{ $adminName }}</strong>,</p>
              <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">
                Une tentative de connexion a été détectée sur votre compte administrateur Thunder Express.
                Utilisez le code ci-dessous pour valider votre identité.
              </p>

              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:28px 0;">
                    <div style="display:inline-block;background:linear-gradient(135deg,#f0fffe,#e6fbf9);border:2px solid rgba(10,225,204,0.35);border-radius:16px;padding:24px 48px;">
                      <p style="margin:0 0 6px;font-size:12px;color:#00A896;letter-spacing:3px;text-transform:uppercase;font-weight:600;">Code de vérification</p>
                      <p style="margin:0;font-size:44px;font-weight:800;letter-spacing:12px;color:#00A896;font-family:'Courier New',monospace;">{{ $otp }}</p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8e1;border-radius:10px;border-left:4px solid #FFD700;margin-bottom:24px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <p style="margin:0;font-size:13px;color:#92610a;">
                      ⏱ Ce code est valable pendant <strong>10 minutes</strong>.
                      Ne le partagez avec personne.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
                Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
                Votre compte reste sécurisé.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fffe;padding:20px 40px;text-align:center;border-top:1px solid rgba(0,168,150,0.1);">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                © {{ date('Y') }} Thunder Express &mdash; Admin Portal
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>

