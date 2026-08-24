---
title: "Stop Mocking S3: How To Truly do S3 Integration Tests Locally for $0"
description: "Run reliable S3 integration tests locally with MinIO, Docker and the AWS SDK — without cloud credentials, fragile mocks or infrastructure costs."
seoTitle: "S3 Integration Tests Locally with MinIO | Pedro Mello"
seoDescription: "Run reliable S3 integration tests locally with MinIO, Docker and the AWS SDK, without cloud credentials, fragile mocks or extra costs."
publishedAt: 2026-05-08
updatedAt: 2026-05-08
category: "Building Manifold"
tags: ["DevOps","How To","Manifold","Tutorial","AWS","S3","Tests","Tutorials"]
cover: "/images/posts/stop-mocking-s3-how-to-truly-do-s3-integration-tests-locally-for-0/cover.webp"
coverAlt: "Hand coding on a PC and a text featuring True S3 integration tests locally"
sourceUrl: "https://pedro.tec.br/stop-mocking-s3-how-to-truly-do-s3-integration-tests-locally-for-0/"
draft: false
---
We’ve all been there. You’re building a feature that stores files—game binaries, user avatars, or cat memes on AWS S3 or Cloudflare R2.

You write a neat little wrapper around `@aws-sdk/client-s3`. Then, you write a unit test. You mock the `S3Client` instance, spy on the `.send()` method, and stub out a fake presigned upload URL. Your test runner lights up in a beautiful, reassuring green. You push to main, trigger a deploy, and… *boom*.

It crashes in production because the bucket policy expects a specific Content-Type, or the SDK version you actually shipped has a slightly different method signature, or path-style routing was misconfigured.

Mocked unit tests are a comfort blanket, not a shield. If you’re only testing your *assumptions* of how S3 works, you aren’t testing S3 at all. Here is how we stopped dreaming and started testing real S3 integrations locally in **Manifold** using Docker and MinIO—with zero cloud costs.

* * *

## The AI Copilot Catalyst (Why Mocks Are Dead in 2026)

Let’s address the elephant in the room: AI-generated code.

Large Language Models are absolute wizards at writing boilerplate. I use them daily, and we love them. But AI is also a master of deception. It can write syntactically pristine TypeScript code using the AWS SDK v3, matching your types flawlessly. The compiler smiles, and your linter doesn’t blink.

But the AI doesn’t know that the version of the SDK in your lockfile has a subtle API divergence. It doesn’t know that your production bucket expects virtual-hosted routing, while your local machine needs path-style routing. If you rely on mocked unit tests, **you are letting AI write the code, and then letting AI write the mocks that validate its own hallucinated behaviors.** It’s a closed-loop system of self-affirming bugs.

The only way to sleep soundly is to have a real, live S3-compatible engine waiting to receive actual bytes during your test runs. That is our ultimate safety net against regressions.

* * *

## 1\. MinIO: Your S3 Sandbox in Docker

To run real integration tests, we don’t want to hit a real AWS bucket. That introduces internet latency, requires managing shared `.env` cloud credentials, and leaves you vulnerable to a surprise AWS bill.

Instead, we use **MinIO**, an open-source, ultra-fast, S3-compatible object storage service that runs beautifully in a container.

Here is the exact service block from Manifold’s `infra/compose.yaml`:

```yaml
services:
  # ... postgres and mailcatcher services
  minio:
    container_name: "minio-dev"
    image: minio/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      - MINIO_ROOT_USER=local_access_key
      - MINIO_ROOT_PASSWORD=local_secret_key
    command: server /data --console-address ":9001"
```

In our local and CI environments, this spins up an offline S3 server on port `9000` in milliseconds.

Our local development environment configuration `.env.development`:

```bash
# Storage (Cloudflare R2 / S3 Compatible)
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_ACCESS_KEY=local_access_key
STORAGE_SECRET_KEY=local_secret_key
STORAGE_BUCKET_NAME=manifold-local-bucket
STORAGE_PUBLIC_URL=http://localhost:9000/${STORAGE_BUCKET_NAME}
```

* * *

## 2\. Navigating the Path-Style Routing Trap

Here is where 90% of developers get tripped up when using S3 emulators.

By default, AWS S3 uses virtual-hosted style requests (e.g., `https://my-bucket.s3.amazonaws.com/object`). But locally, unless you are editing your hosts file and configuring local DNS, MinIO is listening on `http://localhost:9000`. It doesn’t know what `my-bucket.localhost:9000` is.

We must force the S3 client to use **path-style routing** (e.g., `http://localhost:9000/my-bucket/object`) in development, while using standard virtual-hosted routing for Cloudflare R2 in production.

Here is how we solved this elegantly in `infra/storage.ts`:

```typescript
import { S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.NODE_ENV === "production" ? "auto" : "us-east-1",
  endpoint: process.env.STORAGE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY,
    secretAccessKey: process.env.STORAGE_SECRET_KEY,
  },
  // Crucial: path-style routing is false for production (R2),
  // but must be true for local MinIO emulation!
  forcePathStyle: process.env.NODE_ENV === "production" ? false : true,
});
```

* * *

## 3\. The Ultimate Integration Test (Testing the Full Roundtrip)

Now for the crown jewel: our integration test.

At Manifold, we don’t just assert that our API generates a presigned URL. We don’t take the SDK’s word for it. **Our test actually performs a real HTTP `PUT` request with binary data to the generated presigned URL and asserts that MinIO accepts the payload with a `200 OK` status.**

Here is the actual implementation from our upload suite `tests/integration/api/v1/games/[slug]/files/upload-url/post.test.ts`:

```typescript
describe("Authenticated owner with feature", () => {
  test("Should return 200 and a presigned URL", async () => {
    const owner = await orchestrator.createUser();
    await orchestrator.activateUser(owner.id);
    await orchestrator.addFeaturesToUser(owner.id, [
      "create:game",
      "create:game_file",
    ]);
    const game = await orchestrator.createGame(owner.id);
    const session = await orchestrator.createSession(owner.id);

    // 1. Request the presigned upload URL from our API endpoint
    const response = await fetch(
      `${webserver.getOrigin()}/api/v1/games/${game.slug}/files/upload-url`,
      {
        method: "POST",
        headers: {
          Cookie: `session_id=${session.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: "game.exe",
          content_type: "application/octet-stream",
          size_bytes: 1024,
        }),
      },
    );

    expect(response.status).toBe(200);
    const responseBody = await response.json();

    // Verify the URL structure
    expect(responseBody.upload_url).toContain("http://");
    expect(responseBody.object_key).toContain(`games/${game.id}/files/`);

    // 2. Put our money where our mouth is: ACTUALLY upload a payload using the presigned URL!
    const uploadResponse = await fetch(responseBody.upload_url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/octet-stream",
      },
      body: "fake game binary data",
    });

    // If MinIO, our client config, or the signature generation is broken, this will fail.
    expect(uploadResponse.status).toBe(200);
  });
});
```

By verifying the roundtrip, we guarantee that the client-to-server-to-S3 handshake works flawlessly under simulated real-world conditions.

* * *

## 4\. Test Isolation: The Clean Slate Principle

When running local integration tests, isolation is everything. If file state leaks from one test into another, you will introduce flakiness and false positives.

To solve this, our test orchestrator runs a complete reset of both our database and our local storage before every test file starts.

In `tests/orchestrator.js`, we run:

```javascript
beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabaseRows();
  await orchestrator.clearStorage(); // <-- Reset storage!
});
```

And how does `clearStorage()` work under the hood? It wipes the slate clean by purging existing buckets and recreating them:

```typescript
// infra/storage.ts
export async function clearAllBuckets(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Cannot clear buckets in production environment");
  }

  try {
    // 1. List all buckets
    const listBucketsResponse = await s3Client.send(new ListBucketsCommand({}));
    const buckets = listBucketsResponse.Buckets || [];

    for (const bucket of buckets) {
      if (!bucket.Name) continue;

      // 2. Delete all objects in this bucket first (S3 requires buckets to be empty before deletion)
      const listObjectsResponse = await s3Client.send(
        new ListObjectsCommand({ Bucket: bucket.Name }),
      );
      const objects = listObjectsResponse.Contents || [];

      for (const object of objects) {
        if (!object.Key) continue;
        await s3Client.send(
          new DeleteObjectCommand({ Bucket: bucket.Name, Key: object.Key }),
        );
      }

      // 3. Delete the bucket
      await s3Client.send(new DeleteBucketCommand({ Bucket: bucket.Name }));
    }
  } catch (error) {
    console.error("Failed to delete all buckets:", error);
    throw new InternalServerError({ cause: error });
  }
}

export async function createBucket(
  newBucketName: string = bucketName,
): Promise<void> {
  await s3Client.send(new CreateBucketCommand({ Bucket: newBucketName }));
}
```

This clean-up protocol is fast, deterministic, and ensures every single test runs against a pristine, mock-free S3 environment.

* * *

## Summary: Confident, Credential-Free CI/CD Pipelines

Setting up integration tests for all our services has been one of the biggest architectural wins for Manifold.

-   **Zero Mock Deception:** We test real network traffic, real client uploads, and real AWS SDK commands.
-   **Hermetic and Secure CI/CD:** Our pipeline does not require credentials stored in GitHub Secrets. S3 tests run instantly within our Docker container workflows.
-   **Instant Feedback:** We can develop and run our entire test suite entirely offline (on an airplane, at a coffee shop, or during an ISP outage).

Happy testing!

* * *

## 🌍 About Manifold

If you enjoyed this peek under the hood of our testing infrastructure, you’ll love the broader vision we’re building. **Manifold** is the open-source distribution infrastructure designed to power multiple independent, interoperable game stores (we call them *Outlets*) from a single shared backend. Just like Valve created Steam, Manifold enables creators, communities, and studios to launch their own customized gaming storefronts while letting players access all their purchases in a single, unified library.

We are in active pre-release development and we’d love to have your eyes on it. Dive deeper, check out our vision, and join the journey:

-   **Official Website:** [manifoldpowered.com](https://manifoldpowered.com)
-   **GitHub Repository:** [github.com/pedromello/manifoldpowered.com](https://github.com/pedromello/manifoldpowered.com)
