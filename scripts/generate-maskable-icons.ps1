Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'

# Maskable icons must be full-bleed (no rounded corners, no transparency) with the
# logo confined to the centre 80% safe zone, because Android crops the canvas to
# a circle/squircle of varying shape.
function New-MaskableBitmap([int]$size) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::FromArgb(255, 0x0D, 0x1B, 0x3D))

    # Full-bleed background gradient.
    $grad = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.PointF(0, 0)),
        (New-Object System.Drawing.PointF($size, $size)),
        ([System.Drawing.Color]::FromArgb(255, 0x0D, 0x1B, 0x3D)),
        ([System.Drawing.Color]::FromArgb(255, 0x1A, 0x2D, 0x5A))
    )
    $g.FillRectangle($grad, 0, 0, $size, $size)

    # Logo scaled into the centre 80% safe zone.
    $scale = (0.8 * $size) / 32.0
    $offset = 0.1 * $size

    function M($x, $y) {
        New-Object System.Drawing.PointF(($offset + ($x + 2) * $scale), ($offset + ($y + 2) * $scale))
    }

    $white = @(
        (M 14 6), (M 0 14), (M 14 22), (M 24 16), (M 24 22),
        (M 27 22), (M 27 14), (M 28 14)
    )
    $red = @(
        (M 0 14), (M 14 22), (M 28 14), (M 14 6)
    )

    $whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $g.FillPolygon($whiteBrush, [System.Drawing.PointF[]]$white)

    $redBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(128, 0xE6, 0x39, 0x46))
    $g.FillPolygon($redBrush, [System.Drawing.PointF[]]$red)

    $g.Dispose()
    return $bmp
}

foreach ($size in @(192, 512)) {
    $bmp = New-MaskableBitmap $size
    $out = Join-Path $PWD "public/icons/icon-maskable-$size.png"
    $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "wrote $out ($size x $size, full-bleed, logo in 80% safe zone)"
}