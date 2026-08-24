---
title: "Fixing Docker DNS Resolution Issues with systemd-resolved on Linux"
description: "Diagnose and fix Docker DNS resolution failures caused by systemd-resolved on Ubuntu, Debian and other Linux distributions."
seoTitle: "Fix Docker DNS with systemd-resolved on Linux"
seoDescription: "Fix Docker DNS resolution failures caused by systemd-resolved on Ubuntu, Debian and other Linux distributions with a safe daemon configuration."
publishedAt: 2025-12-31
updatedAt: 2025-12-31
category: "Software Engineering"
tags: ["DevOps","DNS","How To","Tutorial"]
cover: "/images/posts/fixing-docker-dns-resolution-issues-with-systemd-resolved-on-linux/cover.webp"
coverAlt: "Docker containers resolving DNS through systemd-resolved on Linux"
sourceUrl: "https://pedro.tec.br/fixing-docker-dns-resolution-issues-with-systemd-resolved-on-linux/"
draft: false
---
## The Problem

If you’re running Docker on a Linux system with `systemd-resolved` (common on Ubuntu, Debian, and Arch-based distributions), you might encounter DNS resolution failures during Docker builds, especially when installing dependencies from Git repositories.

### Symptoms

Your Docker build fails with errors like:

```
fatal: unable to access 'https://github.com/user/repo.git/': 
Could not resolve host: github.com (DNS server returned answer with no data)
```

The frustrating part? **The same Dockerfile builds perfectly on other machines and servers**, on yours.

## Root Cause

The issue stems from how `systemd-resolved` handles DNS resolution:

1.  **systemd-resolved** uses a local DNS stub resolver at `127.0.0.53`
2.  Your host’s `/etc/resolv.conf` points to this local address: `nameserver 127.0.0.53`
3.  **Docker copies the host’s `/etc/resolv.conf`** into containers during build
4.  Inside the container, `127.0.0.53` doesn’t work because `systemd-resolved` runs on the host, not in the container
5.  Result: DNS resolution fails

You can verify this is your issue by checking your `resolv.conf`:

```
cat /etc/resolv.conf
```

If you see `nameserver 127.0.0.53`, you’re affected by this issue.

## The Solution

Configure Docker to use public DNS servers globally instead of copying the host’s DNS configuration.

### Step 1: Create Docker Daemon Configuration

* * *

**⚠️ Important Warning: Risk of Overwriting Existing Configuration**

The command below will **overwrite** `/etc/docker/daemon.json` if it already exists.

-   **If the file is empty or doesn’t exist**: You’re good to go.
-   **If you have existing advanced configurations** (such as `insecure-registries`, `log-driver`, `storage-driver`, etc.): They will be **completely replaced**.

To preserve existing settings, merge the DNS configuration manually.

* * *

**Create or edit `/etc/docker/daemon.json`:**

```
sudo tee /etc/docker/daemon.json &gt; /dev/null &lt;&lt;'EOF'
{
  "dns": ["8.8.8.8", "8.8.4.4", "1.1.1.1"]
}
EOF
```

This tells Docker to use:

-   `8.8.8.8` and `8.8.4.4` — Google Public DNS
-   `1.1.1.1` — Cloudflare DNS

### Step 2: Restart Docker

```
sudo systemctl restart docker
```

### Step 3: Verify the Fix

```
docker run --rm alpine cat /etc/resolv.conf
```

You should see:

```
nameserver 8.8.8.8
nameserver 8.8.4.4
nameserver 1.1.1.1
```

### Step 4: Test Your Build

```
docker-compose build your-service
```

## Why This Works

1.  **All containers** use the specified DNS servers
2.  **Public DNS servers** are accessible from inside containers
3.  **Git dependencies** resolve correctly
4.  **Configuration persists** across reboots
5.  **No Dockerfile changes** required

## Alternative DNS Servers

```
{
  "dns": ["1.1.1.1", "1.0.0.1"]
}
```

```
{
  "dns": ["8.8.8.8", "8.8.4.4"]
}
```

```
{
  "dns": ["9.9.9.9", "149.112.112.112"]
}
```

## Impact on Existing Containers

-   **Running containers**: Keep old DNS until restarted
-   **New containers**: Use new DNS automatically
-   **Builds**: Fixed immediately

Restart running containers:

```
docker-compose restart
```

## Troubleshooting

```
sudo cat /etc/docker/daemon.json
```

```
sudo systemctl status docker
```

```
sudo journalctl -u docker -n 50
```

Ensure valid JSON syntax (no trailing commas).

## Why Not Other Solutions?

Other solutions require editing **Docker Compose** or **Dockerfile** files, but they come with additional drawbacks.

-   ❌ **Docker Compose** -> `network: host` — Security issues
-   ❌ **Docker Compose** -> Per-service DNS — Repetitive
-   ❌ **Dockerfile** -> Dockerfile hacks — Break portability

The daemon-level DNS configuration is the **correct, permanent solution**.

## Conclusion

DNS resolution issues in Docker builds are common on Linux systems using `systemd-resolved`. Configuring Docker to use public DNS servers ensures consistent, production-like behavior and eliminates the classic “works on my machine” problem.

* * *
