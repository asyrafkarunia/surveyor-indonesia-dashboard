<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Surat Audiensi - {{ $letter->letter_number }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.6;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            font-size: 18px;
            margin: 0;
        }
        .content {
            margin: 20px 0;
        }
        .footer {
            margin-top: 50px;
        }
        .signature-container {
            width: 100%;
            margin-top: 30px;
        }
        .signature-box {
            width: 33%;
            float: left;
            text-align: center;
        }
        .signature-img {
            height: 60px;
            margin: 10px 0;
        }
        .clear {
            clear: both;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>SURAT AUDIENSI</h1>
        <p>No. {{ $letter->letter_number }}</p>
    </div>

    <div class="content">
        <p>Kepada Yth,</p>
        <p><strong>{{ $letter->company_name }}</strong></p>
        <p>{{ optional($client)->address ?? '' }}</p>

        <p>Dengan hormat,</p>
        <p>Sehubungan dengan hal tersebut di atas, kami dari PT Surveyor Indonesia bermaksud untuk mengadakan audiensi dengan {{ $letter->purpose }} dalam rangka:</p>

        <p><strong>{{ $letter->purpose }}</strong></p>

        @if($letter->content)
        <p>{{ $letter->content }}</p>
        @endif

        <p>Demikian surat ini kami sampaikan. Atas perhatian dan kerjasamanya kami ucapkan terima kasih.</p>
    </div>

    <div class="footer">
        <p>Jakarta, {{ $letter->date ? $letter->date->format('d F Y') : now()->format('d F Y') }}</p>
        <p>PT Surveyor Indonesia</p>

        <div class="signature-container">
            <div class="signature-box" style="width: 50%; text-align: left; float: left;">
                <p>Senior Manager</p>
                @if(isset($smSignaturePath) && $smSignaturePath)
                    <img src="{{ $smSignaturePath }}" class="signature-img" style="height: 60px; display: block; margin: 5px 0;">
                @else
                    <div style="height: 70px;"></div>
                @endif
                <p style="margin: 0;"><u>( Senior Manager )</u></p>
            </div>

            <div class="signature-box" style="width: 50%; text-align: left; float: left;">
                <p>General Manager</p>
                @if(isset($gmSignaturePath) && $gmSignaturePath)
                    <img src="{{ $gmSignaturePath }}" class="signature-img" style="height: 60px; display: block; margin: 5px 0;">
                @else
                    <div style="height: 70px;"></div>
                @endif
                <p style="margin: 0;"><u>( General Manager )</u></p>
            </div>
            <div class="clear"></div>
        </div>
    </div>
</body>
</html>
