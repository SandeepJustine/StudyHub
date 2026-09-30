Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'

function New-MasterBitmap([int]$size) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Transparent canvas so the rounded corners stay clean.
    $g.Clear([System.Drawing.Color]::Transparent)

    $k = $size / 32.0

    # Rounded square background with the navy gradient from the SVG.
    $rect = New-Object System.Drawing.RectangleF(0, 0, $size, $size)
    $radius = 8 * $k
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $radius * 2
    $path.AddArc(0, 0, $d, $d, 180, 90)
    $path.AddArc($size - $d, 0, $d, $d, 270, 90)
    $path.AddArc($size - $d, $size - $d, $d, $d, 0, 90)
    $path.AddArc(0, $size - $d, $d, $d, 90, 90)
    $path.CloseFigure()

    $grad = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.PointF(0, 0)),
        (New-Object System.Drawing.PointF($size, $size)),
        ([System.Drawing.Color]::FromArgb(255, 0x0D, 0x1B, 0x3D)),
        ([System.Drawing.Color]::FromArgb(255, 0x1A, 0x2D, 0x5A))
    )
    $g.FillPath($grad, $path)

    # Graduation cap: all straight segments, translated by (2,2) as in the SVG.
    function P($x, $y) {
        New-Object System.Drawing.PointF((($x + 2) * $k), (($y + 2) * $k))
    }

    $white = @(
        (P 14 6), (P 0 14), (P 14 22), (P 24 16), (P 24 22),
        (P 27 22), (P 27 14), (P 28 14)
    )
    $red = @(
        (P 0 14), (P 14 22), (P 28 14), (P 14 6)
    )

    $whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $g.FillPolygon($whiteBrush, [System.Drawing.PointF[]]$white)

    $redBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(128, 0xE6, 0x39, 0x46))
    $g.FillPolygon($redBrush, [System.Drawing.PointF[]]$red)

    $g.Dispose()
    return $bmp
}

function Save-Png([System.Drawing.Bitmap]$src, [string]$path, [int]$size) {
    $dst = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($dst)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.DrawImage($src, 0, 0, $size, $size)
    $g.Dispose()
    $dst.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $dst.Dispose()
    Write-Output "wrote $path ($size x $size)"
}

$master = New-MasterBitmap 512

# Apple touch icon (iOS home screen) - 180x180 is the required size.
Save-Png $master (Join-Path $PWD 'src/app/apple-icon.png') 180
# PWA / manifest + social sizes.
Save-Png $master (Join-Path $PWD 'src/app/icon.png') 512
Save-Png $master (Join-Path $PWD 'public/icons/icon-192.png') 192
Save-Png $master (Join-Path $PWD 'public/icons/icon-512.png') 512
# Modern PNG, replaces the 32x32 original.
Save-Png $master (Join-Path $PWD 'public/favicon.png') 64

# Build a multi-size favicon.ico. Vista+ reads PNG payloads directly from ICO.
$sizes = @(16, 32, 48)
$images = @{}
foreach ($s in $sizes) {
    $tmp = New-Object System.Drawing.Bitmap($s, $s, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($tmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($master, 0, 0, $s, $s)
    $g.Dispose()
    $ms = New-Object System.IO.MemoryStream
    $tmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $images[$s] = $ms.ToArray()
    $tmp.Dispose(); $ms.Dispose()
}

$count = $sizes.Count
$ms2 = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter($ms2)

# ICONDIR
$bw.Write([UInt16]0)   # reserved
$bw.Write([UInt16]1)   # type: icon
$bw.Write([UInt16]$count)

$offset = 6 + (16 * $count)
foreach ($s in $sizes) {
    $bytes = $images[$s]
    $dim = if ($s -ge 256) { [byte]0 } else { [byte]$s }
    $bw.Write($dim)                 # width
    $bw.Write($dim)                 # height
    $bw.Write([byte]0)              # palette
    $bw.Write([byte]0)              # reserved
    $bw.Write([UInt16]1)            # colour planes
    $bw.Write([UInt16]32)           # bits per pixel
    $bw.Write([UInt32]$bytes.Length)
    $bw.Write([UInt32]$offset)
    $offset += $bytes.Length
}
foreach ($s in $sizes) { $bw.Write($images[$s]) }
$bw.Flush()

[System.IO.File]::WriteAllBytes((Join-Path $PWD 'public/favicon.ico'), $ms2.ToArray())
Write-Output "wrote public/favicon.ico ($($ms2.Length) bytes, sizes: $($sizes -join ', '))"

$bw.Dispose(); $ms2.Dispose(); $master.Dispose()