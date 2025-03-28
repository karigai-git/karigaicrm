# PowerShell script to transfer files to Hetzner
$ErrorActionPreference = "Stop"

# Server credentials
$SERVER_IP = "65.109.167.179"
$USERNAME = "root"

Write-Host "Starting file transfer to Hetzner server ($SERVER_IP)..."

# Files to transfer
$files = @(
    "deploy-hetzner.sh",
    "Dockerfile.hetzner",
    "nginx.conf"
)

# Transfer each file
foreach ($file in $files) {
    Write-Host "Transferring $file..."
    scp -o "StrictHostKeyChecking=accept-new" "$file" "${USERNAME}@${SERVER_IP}:/tmp/"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Successfully transferred $file" -ForegroundColor Green
    } else {
        Write-Host "Failed to transfer $file" -ForegroundColor Red
    }
}

Write-Host "File transfer completed!"

# Create a remote script to make deploy-hetzner.sh executable
$remoteScript = @"
#!/bin/bash
chmod +x /tmp/deploy-hetzner.sh
echo "Made deploy-hetzner.sh executable"
"@

$remoteScriptFile = "$env:TEMP\remote_script.sh"
Set-Content -Path $remoteScriptFile -Value $remoteScript

# Transfer the remote script
scp -o "StrictHostKeyChecking=accept-new" $remoteScriptFile "${USERNAME}@${SERVER_IP}:/tmp/remote_script.sh"

# Execute the remote script
ssh -o "StrictHostKeyChecking=accept-new" "${USERNAME}@${SERVER_IP}" "bash /tmp/remote_script.sh"

# Clean up
Remove-Item -Path $remoteScriptFile -Force

Write-Host "All operations completed successfully!" -ForegroundColor Green 