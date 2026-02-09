param(
    [string]$docxPath
)

Add-Type -AssemblyName System.IO.Compression.FileSystem

$zip = [System.IO.Compression.ZipFile]::OpenRead($docxPath)
$entry = $zip.Entries | Where-Object { $_.Name -eq 'document.xml' }
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$content = $reader.ReadToEnd()
$reader.Close()
$zip.Dispose()

# Remove XML tags to get plain text
$content = $content -replace '<[^>]+>', ' '
$content = $content -replace '\s+', ' '

Write-Output $content
