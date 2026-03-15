# ============================================
# GitHub Deployment Secrets Configuration
# ============================================
# Add these secrets to your GitHub repository:
# Settings → Secrets and variables → Actions → New repository secret
# ============================================

# SSH Key for server access (generate with: ssh-keygen -t ed25519)
SERVER_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END OPENSSH PRIVATE KEY-----

# Server hostname or IP address
SERVER_HOST=your_server_ip_or_domain

# SSH username on server
SERVER_USER=your_username

# SSH port (usually 22)
SERVER_PORT=22

# Path where dist/ files will be deployed
DEPLOY_PATH=/var/www/astruxo.net

# ============================================
# How to Generate SSH Key:
# ============================================
# 1. Run: ssh-keygen -t ed25519 -C "github-actions"
# 2. Copy content of ~/.ssh/id_ed25519 (entire file)
# 3. Add to GitHub secret as SERVER_SSH_KEY
# 4. Add public key to server: ~/.ssh/authorized_keys
# ============================================
