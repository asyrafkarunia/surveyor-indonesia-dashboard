<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Lang;

class VerifyEmailNotification extends VerifyEmail
{
    /**
     * Build the mail representation of the notification.
     * Full Bahasa Indonesia with PT Surveyor Indonesia branding.
     */
    protected function buildMailMessage($url)
    {
        return (new MailMessage)
            ->subject('Verifikasi Alamat Email — MARS PT Surveyor Indonesia')
            ->greeting('Yth. Bapak/Ibu,')
            ->line('Terima kasih telah mendaftarkan akun pada sistem **MARS** (Marketing Analysis Report System) — PT Surveyor Indonesia (Persero).')
            ->line('Untuk mengaktifkan akun Anda dan mulai menggunakan sistem, silakan klik tombol di bawah ini untuk memverifikasi alamat email Anda:')
            ->action('Verifikasi Email Saya', $url)
            ->line('Tautan verifikasi ini berlaku selama **60 menit** sejak email ini dikirim.')
            ->line('Apabila Anda tidak merasa mendaftarkan akun pada sistem MARS, Anda dapat mengabaikan email ini dan tidak perlu melakukan tindakan apapun.')
            ->salutation('Hormat kami,')
            ->line('**Tim MARS — PT Surveyor Indonesia (Persero) Cabang Pekanbaru**')
            ->line('_Jl. Bukit Raya Indah No.1, Simpang Tiga, Kec. Bukit Raya, Kota Pekanbaru, Riau 28284_')
            ->line('_www.ptsi.co.id_');
    }
}
