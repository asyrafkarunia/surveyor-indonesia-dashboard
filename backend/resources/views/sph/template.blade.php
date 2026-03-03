<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>SPH - {{ $sph->sph_no }}</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 11px; line-height: 1.5; color: #111; }
        .row { width: 100%; display: table; }
        .col { display: table-cell; vertical-align: top; }
        .col-6 { width: 50%; }
        .col-7 { width: 58%; }
        .col-5 { width: 42%; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .title { font-size: 16px; font-weight: bold; letter-spacing: .5px; }
        .muted { color: #555; }
        .box { border: 1px solid #ddd; border-radius: 4px; padding: 8px; }
        .table { width: 100%; border-collapse: collapse; }
        .table td { border: 1px solid #ddd; padding: 6px 8px; }
        .table .label { width: 28%; background: #f7f7f7; font-weight: bold; }
        .separator { border-top: 2px solid #222; margin: 14px 0; }
        .section-title { background: #f0f0f0; border: 1px solid #ddd; padding: 6px 8px; font-weight: bold; }
        .footer { margin-top: 24px; font-size: 10px; color: #333; }
        .signature { height: 70px; border-bottom: 1px solid #bbb; margin: 24px 0 8px; }
    </style>
</head>
<body>
    <div class="row" style="margin-bottom:8px;">
        <div class="col col-6">
            @if(isset($idSurveyLogoPath) && $idSurveyLogoPath)
                <img src="{{ $idSurveyLogoPath }}" style="height:40px;">
            @else
                <strong>IDSurvey</strong>
            @endif
        </div>
        <div class="col col-6 text-right">
            @if(isset($ptsiLogoPath) && $ptsiLogoPath)
                <img src="{{ $ptsiLogoPath }}" style="height:40px;">
            @else
                <strong>Surveyor Indonesia</strong>
            @endif
        </div>
    </div>

    <div class="text-center" style="margin-bottom:10px;">
        <div class="title">SURAT PENAWARAN / QUOTATION LETTER</div>
    </div>

    <div class="row" style="margin-bottom:6px;">
        <div class="col col-6">Doc. No: <strong>{{ $sph->sph_no }}</strong></div>
        <div class="col col-6 text-right">Tanggal / Date: <strong>{{ $sph->date_created->format('d F Y') }}</strong></div>
    </div>

    <div class="row">
        <div class="col col-7">
            <table class="table">
                <tr><td class="label">Klien / Client</td><td><strong>{{ optional($client)->company_name ?? '-' }}</strong></td></tr>
                <tr><td class="label">Pejabat / Attention</td><td>{{ optional($client)->contact_person ?? '-' }}</td></tr>
                <tr><td class="label">Alamat / Address</td><td>{{ optional($client)->address ?? optional($client)->location ?? '-' }}</td></tr>
                <tr><td class="label">Telepon / Phone</td><td>{{ optional($client)->phone ?? '-' }}</td></tr>
                <tr><td class="label">Fax / Facsimile</td><td>-</td></tr>
            </table>
        </div>
        <div class="col col-5">
            <table class="table">
                <tr><td class="label">Referensi / Reference</td><td>-</td></tr>
                <tr><td class="label">Perihal / Concerning</td><td>{{ $sph->project_name }}</td></tr>
                <tr><td class="label">Jasa / Services</td><td>{{ ($sph->items[0]['service'] ?? 'Konsultan') }}</td></tr>
                <tr><td class="label">Lokasi / Location</td><td>{{ optional($client)->location ?? '-' }}</td></tr>
            </table>
        </div>
    </div>

    <div class="row" style="margin-top:6px;">
        <div class="col col-6">
            <div class="box"><strong>Harga Penawaran / Price :</strong> Rp {{ number_format((float)$sph->value, 0, ',', '.') }}</div>
        </div>
        <div class="col col-6">
            @php
                function terbilang_id($number) {
                    $words = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
                    if ($number < 12) return $words[$number];
                    if ($number < 20) return terbilang_id($number-10)." Belas";
                    if ($number < 100) return terbilang_id(intval($number/10))." Puluh ".terbilang_id($number%10);
                    if ($number < 200) return "Seratus ".terbilang_id($number-100);
                    if ($number < 1000) return terbilang_id(intval($number/100))." Ratus ".terbilang_id($number%100);
                    if ($number < 2000) return "Seribu ".terbilang_id($number-1000);
                    if ($number < 1000000) return terbilang_id(intval($number/1000))." Ribu ".terbilang_id($number%1000);
                    if ($number < 1000000000) return terbilang_id(intval($number/1000000))." Juta ".terbilang_id($number%1000000);
                    return number_format($number,0,',','.');
                }
            @endphp
            <div class="box"><strong>Terbilang / In Words :</strong> {{ terbilang_id((int)$sph->value) }} Rupiah</div>
        </div>
    </div>



    <div class="section-title">URAIAN DAN KETENTUAN / TERM AND CONDITION</div>
    <div class="box" style="margin-top:6px;">
        Perusahaan adalah / Company is <strong>PT Surveyor Indonesia</strong> dan Klien / and Client is <strong>{{ optional($client)->company_name ?? '-' }}</strong>
    </div>

    <div class="separator"></div>

    <div class="section-title">Lingkup Pekerjaan / Scope of Work</div>
    <div class="box">{!! nl2br(e($sph->description ?? '')) !!}</div>

    <div class="section-title" style="margin-top:8px;">Ketentuan Penawaran / Condition of Quotation</div>
    <div class="box">{!! nl2br(e($sph->terms_conditions ?? '')) !!}</div>

    <table class="table" style="margin-top:8px;">
        <tr><td class="label">Durasi Waktu / Time Period</td><td>{{ $sph->time_period ?? '-' }}</td></tr>
        <tr><td class="label">Validitas / Quotation Validity</td><td>{{ optional($sph->validity_period)->format('d F Y') ?? '-' }}</td></tr>
        <tr><td class="label">Termin Pembayaran / Term of Payment</td><td>{!! nl2br(e($sph->term_payment ?? '-')) !!}</td></tr>
        <tr><td class="label">Rekening Bank / Bank Account</td><td>{{ $sph->bank_name ?? 'PT Surveyor Indonesia' }}<br>{{ $sph->bank_name ? '' : 'Bank Mandiri cabang Pekanbaru' }}<br>ACC No: {{ $sph->bank_acc_no ?? '108.000.21704.97' }}</td></tr>
    </table>

    <div class="box" style="margin-top:10px;">
        Jika setuju dengan penawaran di atas, mohon menandatangani kolom persetujuan dan dikirim kembali melalui e-mail atau fax / if you agree with the above quotation, please sign the agreement column below and please sent back through e-mail or facsimile.
    </div>
    <div style="height:16px;"></div>
    <div class="box">Dokumen ini sah sebagai konfirmasi Order apabila telah ditandatangani kedua belah pihak (berlaku scan atau faks) / This document is valid as the Order Confirmation, if it has been signed by both parties (scan or facsimile valid)</div>

    <div class="footer row" style="margin-top:18px;">
        <div class="col col-6">
            <strong>PT Surveyor Indonesia (Persero)</strong><br>
            CABANG PEKANBARU<br>
            Jl. Bukit Raya Indah No. 1<br>
            Simpang Tiga, Pekanbaru - 28284<br>
            Riau, Indonesia
        </div>
        <div class="col col-3 text-center">
            (62-761) 848 878<br>
            surveyorindonesia@ptsi.co.id
        </div>
        <div class="col col-3 text-right">
            www.ptsi.co.id
        </div>
    </div>

    <div style="page-break-before: always; margin-top:18px;">
        <div class="section-title">RINCIAN LAYANAN & BIAYA</div>
        @if($sph->items && count($sph->items) > 0)
            <table class="table" style="margin-top:6px;">
                <tr>
                    <td class="label">Item</td>
                    <td class="label">Uraian</td>
                    <td class="label">Qty</td>
                    <td class="label">Person</td>
                    <td class="label">Harga</td>
                    <td class="label">Total</td>
                </tr>
                @foreach($sph->items as $item)
                    @php
                        $itemName = $item['manualUnit'] ?? ($item['unit'] ?? '');
                        $desc = $item['service'] ?? ($item['name'] ?? '');
                        $qty = (int)($item['qty'] ?? ($item['quantity'] ?? 0));
                        $person = (int)($item['person'] ?? 1);
                        $price = (float)($item['unit_price'] ?? ($item['price'] ?? 0));
                        $total = (float)($item['total'] ?? ($qty * $person * $price));
                    @endphp
                    <tr>
                        <td>{{ $itemName }}</td>
                        <td>{{ $desc }}</td>
                        <td>{{ $qty }}</td>
                        <td>{{ $person }}</td>
                        <td>Rp {{ number_format($price, 0, ',', '.') }}</td>
                        <td>Rp {{ number_format($total, 0, ',', '.') }}</td>
                    </tr>
                @endforeach
            </table>
        @endif
    </div>
</body>
</html>
