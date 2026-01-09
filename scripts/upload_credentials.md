# Uploading Google Cloud Credentials to Server via SSH

## Step 1: Find Your Server's IP Address
```bash
curl ifconfig.me
```

## Step 2: Test SSH Connection
```bash
ssh root@your-server-ip
```

## Step 3: Create the Target Directory (if needed)

Check if the directory exists:
```bash
ls -la /data/coolify/secrets/
```

### If Directory Exists:
You'll see the directory listing. Continue to Step 4.

### If Directory Doesn't Exist:
Create it with proper permissions:
```bash
sudo mkdir -p /data/coolify/secrets/
sudo chmod 755 /data/coolify/secrets/
```

Exit SSH:
```bash
exit
```

## Step 4: Upload credentials.json Using SCP

From your **local machine** (not SSH'd into the server), use SCP to copy the file:

```bash
# Navigate to your project root
cd /Users/lucas/Documents/Interfaces/teaching-the-agent

# Upload the file
scp backend/credentials.json root@your-server-ip:/data/coolify/secrets/credentials.json
```

## Step 5: Verify File Upload and Set Permissions

SSH back into your server to verify and set permissions:

```bash
ssh root@your-server-ip
```

### Check if File Exists:
```bash
ls -la /data/coolify/secrets/credentials.json
```

You should see output like:
```
-rw-r--r-- 1 user user 2406 Nov 30 22:00 /data/coolify/secrets/credentials.json
```

### Set Correct Permissions:

The file needs to be readable by the Docker containers. Set permissions:

```bash
# Make file readable by owner and group (644)
sudo chmod 644 /data/coolify/secrets/credentials.json

# Optionally, change ownership if needed (adjust 'coolify' to your docker user)
sudo chown root:root /data/coolify/secrets/credentials.json
```

### Verify Permissions:
```bash
ls -la /data/coolify/secrets/credentials.json
```

Should show: `-rw-r--r--` 

### Verify File Content (Optional):

Quick check to make sure the file isn't corrupted:
```bash
head -n 3 /data/coolify/secrets/credentials.json
```

You should see JSON starting with `{` and `"type": "service_account"`.

Exit SSH:
```bash
exit
```

## Step 6: Restart Docker Containers

The containers need to be restarted to pick up the new credentials file.

### Using Coolify Dashboard
1. Go to your Coolify dashboard
2. Navigate to your application
3. Find the "Redeploy" button
4. Click to restart services