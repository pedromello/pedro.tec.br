---
title: "How to Back Up MongoDB on a DigitalOcean Droplet"
description: "Back up MongoDB on a DigitalOcean Droplet with mongodump, compress the result and transfer it safely to your local machine."
seoTitle: "Back Up MongoDB on DigitalOcean with mongodump"
seoDescription: "Back up MongoDB on a DigitalOcean Droplet with mongodump, compress the backup and transfer it safely to your local machine over SSH."
publishedAt: 2025-06-30
updatedAt: 2025-06-30
category: "Software Engineering"
tags: ["Computer Science","DevOps","Tutorial","backup","Cloud","digitalocean","mongodb","mongodump","ssh","Tutorials"]
cover: "/images/posts/backup-mongodb-digitalocean/cover.webp"
coverAlt: "Conceptual 3D image of the MongoDB and DigitalOcean logos connected by glowing data streams, representing a secure database backup process."
sourceUrl: "https://pedro.tec.br/backup-mongodb-digitalocean/"
draft: false
---
Hi everyone, Pedro Mello here.

In this post, we’ll walk through a crucial task for any developer: backing up a MongoDB database hosted on a DigitalOcean droplet. A reliable backup strategy is fundamental for data integrity and disaster recovery. This guide provides a clear, step-by-step method to ensure your data is safe and recoverable using standard command-line tools.

Let’s get started.

## **The Importance of Regular Backups**

Before diving into the “how,” it’s worth remembering the “why.” Regular backups provide a safety net against a range of potential issues, including:

-   Data corruption during an application update.
-   Accidental data deletion.
-   Server or hardware failure.

Implementing a consistent backup routine is a professional standard that ensures business continuity and peace of mind.

## **The Standard Method: Using `mongodump`**

The most common and flexible tool for creating a “hot” backup of a MongoDB database is `mongodump`. It produces a binary export of your database’s contents, which can be easily restored.

**Step 1: Connect to Your Droplet**

First, you need to access your server’s command line. Open your local terminal and connect to your droplet via SSH.

Bash

```
ssh your_user@your_droplet_ip
```

*(Replace `your_user` (often `root`) and `your_droplet_ip` with your server’s credentials.)*

**Step 2: Run the `mongodump` Command**

With `mongodump`, you can back up your entire MongoDB instance or a single database.

**To back up ALL databases:**

Bash

```
mongodump --out /var/backups/mongobackup_$(date +"%Y-%m-%d")
```

**Breaking down the command:**

-   `mongodump`: The backup utility.
-   `--out`: Specifies that the output will be a **directory** containing the BSON files of your database.
-   `/var/backups/...`: The path where the backup directory will be created. Using `$(date +"%Y-%m-%d")` is a best practice for naming the directory with the current date (e.g., `mongobackup_2025-06-30`), making your backups easy to identify.

**To back up a SPECIFIC database:**

Bash

```
mongodump --db your_database_name --out /var/backups/myapp_backup_$(date +"%Y-%m-%d")
```

After running this, you will have a directory containing your backup files located at `/var/backups/`.

## **Handling a Common Pitfall: `not a regular file` Error**

A frequent issue arises when you try to download the backup. If you attempt to use `scp` on the directory created by `mongodump`, you will likely encounter a `not a regular file` error.

This is because `scp` is designed to copy files, not directories (unless you use a specific flag). The most efficient and reliable way to handle this is to compress the backup directory into a single archive file first.

**Step 3: Compress the Backup Directory**

While still connected to your droplet via SSH, use the `tar` command to create a compressed archive.

Bash

```
# Navigate to the parent directory of your backup
cd /var/backups/

# Create the compressed .tar.gz file (replace with your directory name)
tar -czvf mongobackup_2025-06-30.tar.gz mongobackup_2025-06-30/
```

This command creates a single, portable file (`.tar.gz`) from your backup directory, making it much easier and faster to transfer.

## **Transferring the Backup to Your Local Machine**

Now, return to your **local machine’s terminal** (open a new window if necessary). Use the `scp` command to securely download the compressed archive.

Bash

```
# Replace with your droplet's IP and the correct filename
scp root@your_droplet_ip:/var/backups/mongobackup_2025-06-30.tar.gz .
```

The `.` at the end of the command specifies that the file should be downloaded to your current local directory. You will be prompted for your password, and the transfer will begin.

## **Final Thoughts**

By following these three steps—using `mongodump` to create the backup, `tar` to compress it, and `scp` to transfer it—you can implement a robust and reliable backup routine.

Just like the concepts in AI or DeFi, complex technical tasks often become manageable when broken down into logical steps. Integrating this process into your regular maintenance schedule is a key part of professional application management and data security.
