---
title: "Architecting a Bulletproof CI Pipeline for a Scalable Next.js Project"
description: "A practical CI architecture for scalable Next.js projects using linting, formatting, commit checks and single-command integration tests."
seoTitle: "A Reliable CI Pipeline for Scalable Next.js Projects"
seoDescription: "Build a reliable Next.js CI pipeline with ESLint, Prettier, Commitlint and single-command integration tests for a scalable project foundation."
publishedAt: 2026-03-04
updatedAt: 2026-03-04
category: "Building Manifold"
tags: ["CI","Computer Science","DevOps","How To","Manifold","Study"]
cover: "/images/posts/architecting-a-bulletproof-ci-pipeline-for-a-scalable-next-js-projects/cover.webp"
coverAlt: "Continuous integration pipeline connecting code quality checks, tests and deployment stages"
sourceUrl: "https://pedro.tec.br/architecting-a-bulletproof-ci-pipeline-for-a-scalable-next-js-projects/"
draft: false
---
When you are building an infrastructure designed to serve as the foundation for multiple independent platforms, there is zero room for a fragile core. This is the exact challenge I’m tackling with **[Manifold](https://www.manifoldpowered.com/ "Manifold")**.

Architecturally, Manifold is a unified backend that powers multiple game distribution platforms, which we call *Outlets*. Each Outlet operates as an independent front-end destination with its own visual identity, but they all connect to the same centralized system. This means a user can buy a game on one Outlet, download it on another, and keep their progression synced across the entire ecosystem.

We are building this ecosystem using **Next.js with TypeScript, React, and Prisma as our ORM**.

However, this centralized architecture comes with a high stakes caveat: if the core system fails, every connected Outlet might go down with it. Knowing this, and designing the project to easily accept open-source contributions, I knew that establishing a strict, automated Continuous Integration (CI) pipeline from day one was mandatory.

Here is how I structured Manifold’s Continous Integrator workflow using GitHub Actions to ensure code quality, readable history, and absolute system reliability.

![](/images/posts/architecting-a-bulletproof-ci-pipeline-for-a-scalable-next-js-projects/image-1-1024x400.png)

## 1\. Automating Code Quality: ESLint & Prettier

When a project scales and multiple developers start collaborating, codebases can quickly become a messy patchwork of different coding styles.

To prevent this, our CI pipeline enforces both **[ESLint](https://eslint.org/ "ESLint")** (for code quality) and **[Prettier](https://prettier.io/ "Prettier")** (for formatting), utilizing the strict *Standard* convention.

**The Key Takeaway:** Why fail the build over styling? Because readability directly impacts maintainability. If the code doesn’t meet the automated standard, the build fails. This guarantees that anyone diving into the Manifold codebase will find a clear, predictable structure.

## 2\. Enforcing a Clean History: Commitlint

Reading through a Git history full of messages like `"fixed stuff"`, `"wip"`, or `"updates"` is a nightmare when you are trying to track down when and where a bug was introduced.

To solve this, we implemented **[Commitlint](https://commitlint.js.org/ "Commitlint")** to enforce the [Conventional Commits specification](https://www.conventionalcommits.org/en/v1.0.0/ "Conventional Commits specification") (e.g., `feat:`, `fix:`, `chore:`).

**The Key Takeaway:** A standardized commit history makes bisecting and debugging infinitely easier for the team. Furthermore, laying this groundwork now means we can fully automate our semantic versioning and changelog generation in the future.

## 3\. Reliability at the Core: Single-Command Integration Tests

Testing is the most important part of a CI workflow. Unit tests are great, but for a backend handling complex relational data and cross-platform syncing, you need to know that the database and the application are actually communicating correctly. I prioritized **Integration Tests using Jest**.

The biggest bottleneck in CI is often stabilizing the test environment. I needed the CI pipeline to run autonomously without manual intervention. My rule for this was simple: **a single command must spin up the infrastructure, run the tests, and tear it all down.**

To achieve this, I utilized NPM lifecycle hooks and the `[concurrently](https://www.npmjs.com/package/concurrently "concurrently")` package. Here is a look at the scripts in our `package.json`:

JSON

```
"scripts": {
    "dev": "npm run services:up && npm run services:wait:database && npm run prisma:generate && npm run migrate:dev && next dev",
    "test": "npm run services:up && npm run prisma:generate && npm run migrate:dev && concurrently -n next,jest -k -s command-jest \"next dev\" \"jest --runInBand\"",
    "posttest": "npm run services:down",
    "test:watch": "jest --watchAll --runInBand --verbose",
    "services:up": "docker compose -f infra/compose.yaml up -d",
    "services:stop": "docker compose -f infra/compose.yaml stop",
    "services:down": "docker compose -f infra/compose.yaml down",
    "services:wait:database": "node infra/scripts/wait-for-postgres.js"
}
```

Let’s break down exactly why this **`npm run test`** script works so beautifully in a GitHub Actions runner:

-   **`services:up`**: First, we spin up our PostgreSQL database using Docker Compose in the background (`-d`).
-   **Database Prep**: `npm run prisma:generate` and `npm run migrate:dev` ensure the Prisma client is ready and the fresh test database has the correct schema applied.
-   **`concurrently`**: This is where the magic happens. It boots up the Next.js server AND runs Jest in parallel.
    -   The `-k` (kill others) and `-s command-jest` (success condition) flags are crucial here. They ensure that as soon as Jest finishes running its suite—whether it passes or fails—it automatically kills the Next.js server.
-   **`posttest`**: NPM automatically looks for and runs this lifecycle hook immediately after the `test` script finishes. It executes `services:down`, which gracefully tears down the Docker containers, ensuring we don’t leave orphaned processes or corrupted data behind in the CI runner.

## See the Foundation in Action

![](/images/posts/architecting-a-bulletproof-ci-pipeline-for-a-scalable-next-js-projects/image-1024x517.png)

Talk is cheap, so I made the entire planning and execution process public. If you want to see exactly how these architectural decisions were translated into code, I highly recommend checking out the [Foundation Milestone on our GitHub](https://github.com/pedromello/manifoldpowered.com/milestone/2?closed=1).

There, you can explore all the individual issues and pull requests we tackled to get this CI/CD pipeline and core architecture up and running. It serves as a great practical reference if you are planning to build a robust, scalable core for your own Next.js projects.

## The Payoff

Setting up a rigorous CI pipeline upfront might feel like it slows down your initial development speed, but it is an investment that pays off exponentially week after week.

By automating formatting, standardizing commits, and running full integration tests on isolated Docker instances on every push, we have built a robust safety net. Developers can push code to Manifold with confidence, knowing that the CI will catch regressions before they ever reach an Outlet.
