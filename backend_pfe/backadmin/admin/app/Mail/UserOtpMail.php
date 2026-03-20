<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class UserOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $otp,
        public string $userName
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '🔐 Code de vérification - Thunder Express',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.user_otp',
            with: [
                'otp'      => $this->otp,
                'userName' => $this->userName,
            ]
        );
    }
}
