<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends ResetPassword
{
    /**
     * Build the mail representation of the notification.
     * Full Bahasa Indonesia with PT Surveyor Indonesia branding.
     */
    protected function buildMailMessage($url)
    {
        return (new MailMessage)
            ->subject('Permintaan Reset Password — MARS PT Surveyor Indonesia')
            ->greeting('Yth. Bapak/Ibu,')
            ->line('Kami menerima permintaan untuk melakukan reset password akun Anda pada sistem **MARS** (Marketing Analysis Report System) — PT Surveyor Indonesia (Persero).')
            ->line('Untuk membuat password baru Anda, silakan klik tombol di bawah ini:')
            ->action('Reset Password Saya', $url)
            ->line('Tautan reset password ini berlaku selama **' . config('auth.passwords.'.config('auth.defaults.passwords').'.expire', 60) . ' menit** sejak email ini dikirim.')
            ->line('Apabila Anda tidak merasa meminta untuk mereset password, Anda dapat mengabaikan email ini dan akun Anda akan tetap aman.')
            ->salutation('Hormat kami,')
            ->line('**Tim MARS — PT Surveyor Indonesia (Persero) Cabang Pekanbaru**')
            ->line('_Jl. Bukit Raya Indah No.1, Simpang Tiga, Kec. Bukit Raya, Kota Pekanbaru, Riau 28284_')
            ->line('_www.ptsi.co.id_');
    }
}
