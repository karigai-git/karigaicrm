@echo off
echo Starting file transfer to Hetzner server...

rem Server credentials
set SERVER_IP=65.109.167.179
set USERNAME=root

echo Transferring deploy-hetzner.sh...
scp -o "StrictHostKeyChecking=accept-new" deploy-hetzner.sh %USERNAME%@%SERVER_IP%:/tmp/

echo Transferring Dockerfile.hetzner...
scp -o "StrictHostKeyChecking=accept-new" Dockerfile.hetzner %USERNAME%@%SERVER_IP%:/tmp/

echo Transferring nginx.conf...
scp -o "StrictHostKeyChecking=accept-new" nginx.conf %USERNAME%@%SERVER_IP%:/tmp/

echo Making deploy-hetzner.sh executable...
ssh -o "StrictHostKeyChecking=accept-new" %USERNAME%@%SERVER_IP% "chmod +x /tmp/deploy-hetzner.sh"

echo File transfer completed! 