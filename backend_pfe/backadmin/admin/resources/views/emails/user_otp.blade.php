<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Code de vérification</title>
    <style>
        body { font-family: sans-serif; background: #f4f4f4; padding: 20px; }
        .card { background: #fff; padding: 30px; border-radius: 12px; max-width: 500px; margin: auto; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; font-size: 22px; text-align: center; }
        .otp { font-size: 32px; font-weight: bold; text-align: center; color: #3880ff; margin: 30px 0; letter-spacing: 5px; }
        p { color: #666; line-height: 1.6; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #999; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Bonjour {{ $userName }},</h1>
        <p>Merci de vous être inscrit sur <strong>Thunder Express</strong>.</p>
        <p>Pour finaliser votre inscription ou vous connecter, veuillez utiliser le code de vérification suivant :</p>
        <div class="otp">{{ $otp }}</div>
        <p>Ce code est valide pendant 10 minutes. Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet e-mail.</p>
        <div class="footer">&copy; 2026 Thunder Express - Application Mobile PFE</div>
    </div>
</body>
</html>
