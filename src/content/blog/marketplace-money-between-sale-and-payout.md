---
title: "A Sale Is Not a Payout: Where Marketplace Money Sits"
description: "Proceeds from a marketplace sale can be earned, held, payable and in transit at different moments. Here is how Manifold is designing that journey around Stripe Connect."
seoTitle: "Stripe Connect Marketplace Payouts Explained | Pedro Mello"
seoDescription: "See what happens between a marketplace card payment and a bank payout, including Stripe balances, holding periods, reserves, refunds and disputes."
publishedAt: 2026-09-01
updatedAt: 2026-09-01
category: "Building Manifold"
tags:
  - "Manifold"
  - "Payments Infrastructure"
  - "Stripe Connect"
  - "Marketplace Infrastructure"
  - "Payouts"
  - "FinTech"
  - "Merchant of Record"
  - "Software Architecture"
cover: "/images/posts/marketplace-money-between-sale-and-payout/01-marketplace-payout-flow-cover.webp"
coverAlt: "A marketplace payment moves from a card through a platform balance and holding gate before reaching a bank"
sourceUrl: "https://pedro.tec.br/marketplace-money-between-sale-and-payout/"
draft: false
---

## TL;DR

A sale, an available balance and a bank payout are different events. Manifold's Ledger determines who earned each share of a sale. The payout layer must then determine when that share becomes eligible to move, how it is grouped into a payout, and what happens if the original payment is refunded or disputed. We are designing that layer around Stripe Connect, with explicit holding rules, risk controls and a predictable payout cadence. The accounting foundation exists; the production provider adapters and bank payout flows are still being built.

A customer pays $100. The studio is owed $70. The Store that referred the sale earns $10. Manifold keeps $20.

The arithmetic is complete, but nobody has received a bank deposit yet.

That distinction sounds obvious until a product calls all four amounts a "balance." In reality, the customer charge, the relevant Stripe account balance, each participant's payout eligibility and the final bank settlement can change at different times. A marketplace has to model those transitions explicitly or every delay looks like missing money.

My [previous article](/zero-sum-ledger-explained/) explained how Manifold's Ledger answers one question: **who earned what?** This article follows the next question: **when can that money safely leave?**

## A $100 sale does not become a $100 payout

The Ledger can assign every cent as soon as the sale is recorded:

| Ledger position | Amount | What it means |
| --- | ---: | --- |
| Consumer payment | +$100.00 | The source of the funds |
| Supplier cost | −$70.00 | Economically owed to the studio |
| Store commission | −$10.00 | Economically owed to the referring Store |
| Platform revenue | −$20.00 | Economically earned by Manifold |
| **Total** | **$0.00** | **Every cent is accounted for** |

Those entries establish ownership in Manifold's accounting model. They do not guarantee that Stripe considers the underlying payment available, that the Store's commission has passed its holding period, that a payout run has selected it, or that a bank has settled the transfer.

This gives us two separate clocks:

- The **accounting clock** records what each party earned and preserves any later reversal.
- The **payout clock** controls when an earned amount becomes eligible, is submitted and reaches an external account.

Keeping those clocks separate is important. Retention should not rewrite the commercial result of a sale. It changes availability, not ownership.

## The moments people collapse into “payment”

In a marketplace, the word "payment" often hides at least four events.

### 1. The customer payment succeeds

The payment provider accepts the charge. This is the event the checkout UI cares about, but it is not the end of the financial lifecycle. Depending on the payment method, funds can still be pending before they become available, and a successful payment can later be refunded or disputed.

### 2. Funds become available inside Stripe

Stripe accounts distinguish pending and available balances. A successful charge does not necessarily make its funds immediately transferable or payable. Settlement timing depends on factors such as payment method, account configuration, country and risk controls.

### 3. Funds may move to a connected account

Stripe Connect supports different charge models, and the choice determines where funds appear and who absorbs fees, refunds and disputes. With direct charges, the charge is created on the connected account and no separate transfer is required for that payment. With destination charges, the platform creates the charge and automatically routes all or a specified portion to the connected account. With separate charges and transfers, the platform charge and later transfers are decoupled.

That last model is especially relevant to marketplaces that split one payment across multiple parties. It is also more operationally complex. The production topology for Manifold is still being validated, so this article describes the product states we need rather than pretending the final Connect configuration has already been chosen.

### 4. A payout reaches a bank

A transfer inside Stripe and a payout to a bank are not the same operation. The connected account can have an available Stripe balance while waiting for its configured payout schedule. Once a payout is submitted, bank settlement can still take additional time or fail because the external account is invalid, restricted or unavailable.

![A marketplace sale progresses through accounting, availability, retention, a payout batch and bank settlement](/images/posts/marketplace-money-between-sale-and-payout/02-sale-to-bank-timeline.webp)

*One sale crosses several systems and clocks before it becomes money in a bank account.*

## A timeline for one sale

Consider the Store's $10 commission from the example above. An illustrative journey might look like this:

| Moment | Financial event | Product state |
| --- | --- | --- |
| Day 0 | Customer pays $100 | Sale recorded |
| Day 0 | Ledger assigns the Store $10 | Held |
| Day 2 | Provider funds become available in the relevant Stripe account | Not yet payout-eligible under Manifold's internal rule |
| Day 30 | The commission reaches its maturity date | Payable |
| Next weekly run | The $10 joins other eligible commissions | Scheduled |
| Provider submits the payout | Funds move toward the external bank account | In transit |
| Bank settlement | The external account receives the payout | Paid |

These dates are examples, not published payout terms. The exact provider delay, holding period, reserve policy and bank settlement time can vary. What should not vary is the participant's ability to see which state applies and why.

This is why one generic `pending` label is not enough. It cannot distinguish a card payment that is still settling from a commission intentionally held for risk, an eligible balance waiting for the next run, or a bank payout already in transit.

## Retention is an eligibility rule, not a second ledger

Manifold's accounting layer already models commission maturity. The payout layer can build on that fact instead of inventing a parallel balance that eventually drifts away from the Ledger.

A useful state model is:

`held → payable → scheduled → in transit → paid`

Provider processing can run alongside those states, and a reversal can cancel or offset the amount. The important invariant is that each transition is derived from recorded events. An operator should not be able to silently change a payout balance without leaving an auditable reason.

![The same marketplace earnings move from a timed hold to a payable balance and then to an in-transit payout](/images/posts/marketplace-money-between-sale-and-payout/03-payout-availability-states.webp)

*The economic entitlement stays constant while availability moves from held, to payable, to in transit.*

We are designing around three controls.

### A minimum holding period

An earned share remains ineligible for payout for a defined period. This reduces exposure to immediate refunds and disputes, but it does not eliminate chargeback risk: card disputes can arrive well after a short operational hold has ended.

### A risk-based reserve

Newer or higher-risk accounts might need part of their otherwise payable balance kept available to absorb later reversals. The final reserve policy is not set. It could depend on transaction history, dispute rate, payment method, account restrictions and other signals.

The product requirement is clearer than the formula: a reserve must be explainable. A Store should be able to see the amount, the reason and the rule that can release it.

### A predictable payout cadence

Weekly batching is the current direction. Per-transaction bank transfers would make small marketplace sales harder to reconcile and could add unnecessary operational cost. A known cadence also gives studios and Store owners a date they can plan around.

A cadence is different from a hold. An amount can be eligible on Tuesday and wait for Friday's payout run. It is payable during that interval, not retained for risk.

## What happens when the sale is reversed

The timing of a refund or dispute changes the payout operation, but it should not change the accounting history.

### Refund before the amount becomes payable

Suppose the Store earns $10 on September 1 with a future maturity date. The customer is refunded while that commission is still held. The Ledger appends a reversing entry with the same maturity date. When both entries mature, they net to zero. Nothing becomes payout-eligible.

### Refund after maturity but before the payout run

Now suppose the $10 is already payable, but no provider movement has started. A reversal can remove the amount from the eligible total before a payout is created. If a Connect transfer has already started, the system may need a transfer reversal even if no bank payout has occurred. The statement still shows the original commission and its reversal; the payout calculation sees their net effect.

### Dispute after money reaches the bank

The harder case arrives after payout. The money has left the Stripe balance, so the platform cannot treat the reversal as if the transfer never happened. Depending on the Connect charge model and account configuration, Stripe can debit the platform or connected account, and the platform may need to reverse a transfer, use a reserve, carry a negative balance, or recover the amount from future earnings.

![A reversal before payout cancels held funds, while a later dispute creates a recovery path after bank settlement](/images/posts/marketplace-money-between-sale-and-payout/04-refund-before-after-payout.webp)

*Before payout, a reversal can cancel eligibility; after payout, the system needs an explicit recovery path.*

This is the real reason "pay everything immediately" is not a complete product policy. Faster payout improves cash flow for participants, but it transfers more residual risk to whoever is liable when a later reversal arrives.

## Failure is a payout state too

A payout run can be correct and still fail outside the Ledger. A bank account might be closed. A connected account might have incomplete verification or become restricted. The provider might reject a transfer because the available balance is insufficient.

Those failures need operations that are safe to retry and explicit states. Retrying a provider request must not create a second payout. A failed bank payout must not mark its entries as paid. An operator needs to see which provider object corresponds to which internal payout run and whether the next action is automatic, manual or blocked on the account owner.

The core references should therefore connect four identifiers:

- the internal sale and Ledger entry sets;
- the participant and connected account;
- the internal payout run and its selected entries;
- the provider transfer, where applicable, and payout objects.

That chain is what makes reconciliation possible when the happy path stops being happy.

## Why the Merchant of Record model matters

Stripe Connect is infrastructure. It does not, by itself, decide who is the Merchant of Record. That role depends on the commercial and legal model around the transaction.

In Manifold's intended Merchant of Record model, the platform centralizes the consumer transaction and the operational responsibility around it. Individual Stores curate and refer sales; they do not each need to create a separate policy for disputes, reserves, payout schedules, tax handling and reconciliation.

Centralization should not mean opacity. It should make one shared rule set possible:

- one explanation for why a balance is held;
- one payout calendar participants can understand;
- one dispute and recovery workflow;
- one audit trail connecting a sale to its bank settlement.

The goal is not to make every payout instant. It is to make every payout correct, predictable and explainable.

## Where this stands today

The accounting foundation is already implemented: balanced sale entry sets, append-only reversals, commission maturity and Store statements exist and are covered by automated tests in the Manifold application.

The production payment-provider and bank payout rails are not finished. The Stripe Connect topology, provider adapters, reserve policy, payout runs, failure recovery and external reconciliation are still being designed and built. Weekly payouts are a direction, not a live promise. The example holding periods in this article are illustrations, not current commercial terms.

That distinction matters because a polished marketplace interface can hide fragile financial operations. I would rather ship the money-moving layer later with states that can be explained than earlier with one ambiguous balance and a collection of manual corrections.

The Ledger answers **whose money is it?** The payout system answers **when can it safely leave, and can we prove where it went?** A marketplace needs both answers before a sale is truly finished.

## References

- [Stripe: Understand how charges work in a Connect integration](https://docs.stripe.com/connect/charges)
- [Stripe: Create separate charges and transfers](https://docs.stripe.com/connect/separate-charges-and-transfers)
- [Stripe: Payouts to connected accounts](https://docs.stripe.com/connect/payouts-connected-accounts)
- [Stripe: Understanding Connect account balances](https://docs.stripe.com/connect/account-balances)
- [Stripe: Disputes on Connect platforms](https://docs.stripe.com/connect/disputes)
