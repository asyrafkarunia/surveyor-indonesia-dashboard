<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>SPH - {{ $sph->sph_no }}</title>
    <style>
        @page {
            margin: 140px 50px 100px 50px;
        }
        body { 
            font-family: Arial, sans-serif; 
            font-size: 11px; 
            line-height: 1.4; 
            color: #000; 
        }
        #bg-cover {
            position: fixed;
            top: -140px;
            left: -50px;
            right: -50px;
            bottom: -100px;
            width: 100%;
            height: 100%;
            z-index: -1000;
        }
        .header-title-wrapper {
            margin-bottom: 20px;
        }
        .title { 
            font-size: 14px; 
            font-weight: bold; 
            text-decoration: underline;
            margin-bottom: 3px;
        }
        
        .row { width: 100%; display: table; }
        .col { display: table-cell; vertical-align: top; }
        .col-left { width: 45%; }
        .col-right { width: 55%; padding-left: 20px;}

        /* Doc detail box */
        .doc-detail-table { width: 100%; border-collapse: collapse; }
        .doc-detail-table td { border: 1px solid #000; padding: 2px 4px; }
        
        /* Information alignment */
        .info-table { width: 100%; border-collapse: collapse; }
        .info-table td { padding: 1px 0; vertical-align: top; }
        .info-label { width: 32%; }
        .info-colon { width: 3%; text-align: center; }
        .info-value { width: 65%; }

        /* Detail price formatting */
        .price-box-table { 
            width: 100%; 
            border-collapse: collapse; 
            border: 1px solid #000; 
            margin-top: 15px; 
        }
        .price-box-table td { 
            padding: 4px 6px; 
            border-bottom: 1px dotted #ccc; 
            border-left: 1px solid #000; 
            border-right: 1px solid #000; 
            vertical-align: top; 
        }
        .price-box-table td.header-blue { 
            background-color: #dbe5f1; 
            border-top: 1px solid #000; 
            border-bottom: 1px solid #000; 
            text-align: center; 
            font-weight: bold; 
            padding: 6px; 
        }
        .price-box-table td.footer-row { border-bottom: 1px solid #000; }

        .desc-table { width: 100%; border-collapse: collapse; }
        .desc-table td { padding: 1px 0; vertical-align: top; }
        .desc-label { width: 30%; }
        .desc-colon { width: 3%; text-align: center; }
        .desc-value { width: 67%; }

        /* Signatures block */
        .signature-section { margin-top: 25px; width: 100%; display: table; }
        .sig-col { display: table-cell; width: 50%; vertical-align: top; }
        .sig-box { height: 75px; margin-top: 5px; position: relative;}
        .initials-block { margin-top: 2px; font-size: 9px; font-style: italic; color: #555;}
        
        .p-text { margin: 8px 0; }
        .table { width: 100%; border-collapse: collapse; margin-top:10px; }
        .table th, .table td { border: 1px solid #000; padding: 4px 6px; }
        .table th { background: #f0f0f0; }

        .page-break { page-break-before: always; }
    </style>
</head>
<body>
    @if(isset($coverPath) && $coverPath)
    <div id="bg-cover">
        <img src="{{ $coverPath }}" style="width: 100%; height: 100%; object-fit: fill;" />
    </div>
    @endif

    <div class="header-title-wrapper">
        <div style="display: table; width: 100%;">
            <div style="display: table-cell; width: 50%;">
                <div class="title">SURAT PENAWARAN / QUOTATION LETTER</div>
            </div>
            <div style="display: table-cell; width: 50%;">
                <table class="doc-detail-table" style="margin-left: auto; width: 90%;">
                    <tr><td style="width: 35%;">Doc. No</td><td>: {{ $sph->sph_no }}</td></tr>
                    <tr><td>Tanggal / <i>Date</i></td><td>: {{ $sph->date_created->format('d F Y') }}</td></tr>
                </table>
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col col-left">
            <table class="info-table">
                <tr><td class="info-label">Klien / <i>Client</i></td><td class="info-colon">:</td><td class="info-value"><strong>{{ optional($client)->company_name ?? '-' }}</strong></td></tr>
                <tr><td class="info-label">Pejabat / <i>Attention</i></td><td class="info-colon">:</td><td class="info-value">{{ optional($client)->contact_person ?? '-' }}</td></tr>
                <tr><td class="info-label">Alamat / <i>Address</i></td><td class="info-colon">:</td><td class="info-value">{{ optional($client)->address ?? optional($client)->location ?? '-' }}</td></tr>
                <tr><td class="info-label">Telepon / <i>Phone</i></td><td class="info-colon">:</td><td class="info-value">{{ optional($client)->phone ?? '-' }}</td></tr>
                <tr><td class="info-label">Fax / <i>Facsimile</i></td><td class="info-colon">:</td><td class="info-value">-</td></tr>
            </table>
        </div>
        <div class="col col-right">
            <table class="info-table">
                <tr><td class="info-label">Referensi / <i>Reference</i></td><td class="info-colon">:</td><td class="info-value">-</td></tr>
                <tr><td class="info-label">Perihal / <i>Concerning</i></td><td class="info-colon">:</td><td class="info-value">{{ $sph->project_name }}</td></tr>
                <tr><td class="info-label">Jasa / <i>Services</i></td><td class="info-colon">:</td><td class="info-value">{{ ($sph->items[0]['service'] ?? 'Konsultan') }}</td></tr>
                <tr><td class="info-label">Lokasi / <i>Location</i></td><td class="info-colon">:</td><td class="info-value">{{ optional($client)->location ?? '-' }}</td></tr>
            </table>
        </div>
    </div>

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

    <table class="price-box-table">
        <tr>
            <td>
                <table class="desc-table">
                    <tr><td class="desc-label">Harga Penawaran / <i>Price</i></td><td class="desc-colon">:</td><td class="desc-value"><strong>Rp {{ number_format((float)$sph->value, 0, ',', '.') }}</strong></td></tr>
                    <tr><td class="desc-label">Terbilang / <i>In Words</i></td><td class="desc-colon">:</td><td class="desc-value"><i>{{ terbilang_id((int)$sph->value) }} Rupiah</i></td></tr>
                    <tr><td class="desc-label">Rincian / <i>Details</i></td><td class="desc-colon">:</td><td class="desc-value">Ada</td></tr>
                </table>
            </td>
        </tr>
        <tr><td class="header-blue">URAIAN DAN KETENTUAN / <i>TERM AND CONDITION</i></td></tr>
        <tr>
            <td style="border-bottom: 1px dotted #ccc; padding: 6px;">
                Perusahaan adalah / <i>Company is</i> <strong>PT Surveyor Indonesia</strong> dan Klien / <i>and Client is</i> <strong>{{ optional($client)->company_name ?? '-' }}</strong>
            </td>
        </tr>
        <tr>
            <td>
                <table class="desc-table">
                    <tr>
                        <td class="desc-label">Lingkup Pekerjaan /<br><i>Scope of Work</i></td>
                        <td class="desc-colon">:</td>
                        <td class="desc-value">
                            {!! nl2br(e($sph->description ?? '')) !!}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td>
                <table class="desc-table">
                    <tr>
                        <td class="desc-label">Ketentuan Penawaran /<br><i>Condition of Quotation</i></td>
                        <td class="desc-colon">:</td>
                        <td class="desc-value">
                            {!! nl2br(e($sph->terms_conditions ?? '')) !!}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td>
                <table class="desc-table">
                    <tr><td class="desc-label">Durasi Waktu / <i>Time Period</i></td><td class="desc-colon">:</td><td class="desc-value">{{ $sph->time_period ?? '-' }}</td></tr>
                </table>
            </td>
        </tr>
        <tr>
            <td>
                <table class="desc-table">
                    <tr><td class="desc-label">Validitas / <i>Quotation Validity</i></td><td class="desc-colon">:</td><td class="desc-value">{{ optional($sph->validity_period)->format('d F Y') ?? '-' }}</td></tr>
                </table>
            </td>
        </tr>
        <tr>
            <td>
                <table class="desc-table">
                    <tr>
                        <td class="desc-label">Termin Pembayaran /<br><i>Term of Payment</i></td>
                        <td class="desc-colon">:</td>
                        <td class="desc-value">{!! nl2br(e($sph->term_payment ?? '-')) !!}</td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr class="footer-row">
            <td style="border-bottom: 1px dotted #ccc;">
                <table class="desc-table">
                    <tr>
                        <td class="desc-label">Rekening Bank /<br><i>Bank Account</i></td>
                        <td class="desc-colon">:</td>
                        <td class="desc-value">
                            <strong>{{ $sph->bank_name ?? 'PT Surveyor Indonesia' }}</strong><br>
                            {{ $sph->bank_name ? '' : 'Bank Mandiri cabang Pekanbaru' }}<br>
                            <strong>ACC No : {{ $sph->bank_acc_no ?? '108.000.21704.97' }}</strong>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <div class="p-text">
        Jika setuju dengan penawaran di atas, mohon menandatangani kolom persetujuan dan dikirim kembali melalui e-mail atau fax / <i>If you agree with the above quotation, please sign the agreement column below and please sent back through e-mail or facsimile.</i>
    </div>
    
    <div class="p-text">
        Dokumen ini sah sebagai konfirmasi Order apabila telah ditandatangani kedua belah pihak (berlaku scan atau faks) / <i>This document is valid as the Order Confirmation, if it has been signed by both parties (scan or facsimile valid).</i>
    </div>

    @if($sph->project && $sph->creator)
    <div class="p-text">
        Kami berharap dapat bekerjasama untuk pekerjaan ini, jika Anda memerlukan klarifikasi lebih lanjut untuk penawaran ini, jangan ragu untuk menghubungi kami / <i>We look forward to provide the services, should you need further clarification please do not hesitate to contact us, phone: (0761) 848878, fax: (0761) 848213 email: marketing.sipku@ptsi.co.id and {{ $sph->creator->email }}</i>
    </div>
    @endif

    <div class="signature-section">
        <div class="sig-col">
            <strong>PT Surveyor Indonesia (Persero)</strong><br>
            CABANG PEKANBARU
            <div class="sig-box">
                @if(isset($gmSignaturePath) && $gmSignaturePath)
                    <img src="{{ $gmSignaturePath }}" style="max-height: 70px;">
                @endif
            </div>
            
            @php
                $gmName = "Ibnu Khaldun"; // Replace with dynamic GM name if available from DB
            @endphp
            <strong><u>{{ $gmName }}</u></strong><br>
            <i>General Manager</i>
            
            <div class="initials-block">
                Paraf:<br>
                Sr. Manager / Preparer: 
                @if(isset($smSignaturePath) && $smSignaturePath)
                    <img src="{{ $smSignaturePath }}" style="max-height: 25px; margin-left: 5px; vertical-align: middle;">
                @else
                    ............... / ...............
                @endif
            </div>
        </div>
        
        <div class="sig-col">
            Saya setuju dengan penawaran harga diatas / <i>I Agree with the above quotation</i><br>
            <strong>{{ optional($client)->company_name ?? '-' }}</strong>
            <div class="sig-box">
                <!-- Client signature region -->
            </div>
            <div style="border-top:1px solid #000; width: 60%; margin-top: 5px; margin-bottom: 5px;"></div>
            <span style="font-size: 9px;">(name)</span><br>
            <span style="font-size: 9px;">(position)</span>
        </div>
    </div>

    <div class="page-break"></div>

    <div class="title" style="margin-top: 10px;">RINCIAN LAYANAN & BIAYA</div>
    @if($sph->items && count($sph->items) > 0)
        <table class="table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Uraian</th>
                    <th>Qty</th>
                    <th>Person</th>
                    <th>Harga</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
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
            </tbody>
        </table>
    @endif
</body>
</html>
