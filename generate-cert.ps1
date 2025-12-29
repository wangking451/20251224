# Generate self-signed certificate for localhost
$certPath = "certs"
New-Item -ItemType Directory -Force -Path $certPath | Out-Null

# Create certificate
$cert = New-SelfSignedCertificate `
    -Subject "CN=localhost" `
    -DnsName "localhost","127.0.0.1" `
    -KeyAlgorithm RSA `
    -KeyLength 2048 `
    -NotBefore (Get-Date) `
    -NotAfter (Get-Date).AddYears(5) `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -FriendlyName "Vite Dev Cert" `
    -HashAlgorithm SHA256 `
    -KeyUsage DigitalSignature, KeyEncipherment, DataEncipherment `
    -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.1")

# Export certificate
$certPassword = ConvertTo-SecureString -String "vite" -Force -AsPlainText
$certPath = "certs\localhost.pfx"
Export-PfxCertificate -Cert $cert -FilePath $certPath -Password $certPassword | Out-Null

# Convert to PEM format (requires OpenSSL or we skip this step)
Write-Host "Certificate generated: $certPath" -ForegroundColor Green
Write-Host "Password: vite" -ForegroundColor Yellow
Write-Host ""
Write-Host "To use in Vite, install vite-plugin-basic-ssl or use https: true" -ForegroundColor Cyan
