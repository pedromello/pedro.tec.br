---
title: "Why Every Manifold Sale Must Add Up to Zero"
description: "How Manifold uses a zero-sum, append-only ledger to split marketplace payments, reject accounting errors, handle reversals and isolate currencies."
seoTitle: "Zero-Sum Ledger for Marketplace Payments | Pedro Mello"
seoDescription: "See how Manifold's zero-sum ledger balances every marketplace sale, rejects missing entries, preserves reversals and keeps currencies auditable."
publishedAt: 2026-08-24
updatedAt: 2026-08-24
category: "Building Manifold"
tags:
  - "Manifold"
  - "Payments Infrastructure"
  - "Double-Entry Accounting"
  - "Marketplace Infrastructure"
  - "FinTech"
  - "Software Architecture"
cover: "/images/posts/zero-sum-ledger-explained/01-ledger-zero-sum-cover.webp"
coverAlt: "A balanced ledger receives one payment and distributes it through three accounted paths"
sourceUrl: "https://pedro.tec.br/zero-sum-ledger-explained/"
draft: false
---

## TL;DR

Every sale on Manifold is recorded as a complete set of money movements. The customer's payment enters as a positive amount; supplier cost, Store commission, and platform revenue are recorded as negative amounts. The set must total exactly zero in each currency or the Ledger rejects it. Corrections are added as reversing entries instead of rewriting history. The accounting layer already enforces these rules; production payment-provider and payout rails are still being built.

Money is one of the easiest things in software to get almost right.

A player pays $100. The studio is owed $70. The Store that referred the sale earns $10. The remaining $20 belongs to the platform. From the outside, the arithmetic looks finished: $70 + $10 + $20 = $100.

Inside a ledger, that is only half the picture. It explains where the money goes, but not where it came from. We also have to record the $100 received from the customer. On Manifold, the complete entry set looks like this:

| Account | Amount |
| --- | ---: |
| Consumer payment | +$100.00 |
| Supplier cost | −$70.00 |
| Store commission | −$10.00 |
| Platform revenue | −$20.00 |
| **Total** | **$0.00** |

Zero does not mean nobody earned anything. It means the books can explain every unit of money that entered the system and where it moved next.

## What “zero-sum” means — and what it does not

Here, “zero-sum” is an accounting property, not a claim that commerce is a zero-sum game. The player receives a game, the studio earns revenue, the Store earns commission, and Manifold keeps its share. The zero is simply the proof that the accounting record is complete.

Think of the sale as a closed box. If $100 enters, the box must contain records explaining all $100. It cannot explain $99.99 and silently lose one cent. It cannot explain $101 and create a dollar that the customer never paid.

### Example: why the customer payment is part of the equation

If we record only `$70 + $10 + $20`, the distributions correctly add up to the $100 sale price, but the ledger still does not show their source. Adding the customer's `+$100` and recording each distribution with the opposite sign gives us the complete movement: `+$100 − $70 − $10 − $20 = $0`.

![One incoming payment closes into a balanced set of three distributions](/images/posts/zero-sum-ledger-explained/02-ledger-balanced-entry-set.webp)

*One payment in, every distribution accounted for, no unexplained remainder.*

## The invariant, not the spreadsheet

The useful part of zero-sum accounting is not the table above. It is what the software refuses to do.

The Ledger rejects any set of entries that does not net to exactly zero within each currency. If a commission is missing, a fee is counted twice, or a rounding remainder has nowhere to go, the write fails. The inconsistent state never becomes part of the books.

### Example: a missing commission

Imagine the customer pays $100, the supplier cost is recorded as $70, and platform revenue is recorded as $20 — but a bug forgets the Store's $10 commission. The set totals `+$100 − $70 − $20 = +$10`. Because it does not equal zero, the entire write is rejected. We discover the missing $10 immediately instead of during a payout weeks later.

The same rule catches duplication. If a service accidentally writes the Store's $10 commission twice, the set becomes `+$100 − $70 − $10 − $10 − $20 = −$10`. That fails too. A balanced ledger cannot tell us whether every commercial decision was wise, but it can tell us that the recorded movements are internally complete.

That changes how we discover a money bug. Instead of asking, “Which report is wrong?”, we can ask a narrower question: “Why did this entry set fail before it was recorded?”

The platform's share is therefore calculated as the residual — gross payment minus supplier cost minus Store commission — rather than as an independent percentage. The other shares are rounded to the ledger's four-decimal storage precision first, and the platform absorbs the remainder. There is no fraction of a cent left drifting between services.

### Example: making rounding deterministic

Suppose a $19.99 sale gives 70% to the supplier and 10% to the Store. At four decimal places, supplier cost is `$13.9930` and Store commission is `$1.9990`. Manifold does not calculate its share independently and hope all three results still fit. It takes the residual: `$19.9900 − $13.9930 − $1.9990 = $3.9980`. The final entry set is guaranteed to close at zero.

## Corrections do not rewrite history

A financial record should be explainable months after it happened. Updating an old row in place would erase the path between the original event and its correction, so the Ledger is append-only: entries are never edited and balances are never stored as a separate source of truth.

If a sale is refunded or charged back, the correction is a new entry set that mirrors and negates the original one. The original remains visible. The reversal points back to it. A balance is simply the sum of the history that now exists.

### Example: refunding the $100 sale

The original sale remains `+$100 − $70 − $10 − $20 = $0`. A full refund adds the mirror image: `−$100 + $70 + $10 + $20 = $0`. Reading both sets together produces no remaining economic effect, while still showing that a sale happened and was later reversed.

![An append-only ledger preserves the original entry and adds a mirrored reversal](/images/posts/zero-sum-ledger-explained/03-ledger-append-only-reversal.webp)

*A correction adds a mirrored record; it never erases the original event.*

This matters for commission holds too. A Store's commission matures after a defined window. A reversal copies the original maturity date, so the sale and its cancellation become payable — or cancel out — at the same instant. Otherwise a refund could appear available before the commission it was meant to reverse.

### Example: refund during the hold

A Store earns $10 on August 1, scheduled to become payable after the hold on August 31. The customer is refunded on August 10. The reversal adds `+$10` against the original `−$10` commission and carries the same August 31 maturity date. Until then, both are held; on August 31, they mature together and net to zero. The payout balance never incorrectly shows $10 available.

## Zero-sum is enforced one currency at a time

An outlet can earn in BRL and USD, but those balances cannot be mixed. A set containing `USD +100` and `BRL −100` is not balanced. It is two unexplained movements in two different currencies.

Every currency must independently sum to zero. When a conversion is needed, the conversion becomes its own recorded pair of entries, carrying the exchange rate that produced it. That is what makes an old transaction reproducible after the market rate has changed.

### Example: two valid sales, two separate balances

A USD sale can close as `USD +100 − 70 − 10 − 20 = 0`. A different BRL sale can close as `BRL +500 − 350 − 50 − 100 = 0`. Both are valid. But `USD +100` paired with `BRL −500` is not a balanced sale, even if the exchange rate happens to be 5 BRL per USD. Each currency still has an unexplained movement.

### Example: paying in a different currency

If a Store earned BRL 500 but requests a USD payout when the recorded rate is 5 BRL per USD, the system cannot simply rename the balance “USD 100.” It records an explicit conversion using that rate, closes the BRL movement, opens the USD movement, and preserves the rate snapshot. Months later, when the market rate is different, the payout can still be reconstructed from the facts recorded at the time.

![Two currencies balance in separate loops connected by an explicit conversion](/images/posts/zero-sum-ledger-explained/04-ledger-per-currency.webp)

*Each currency closes its own loop; conversion is an explicit, auditable movement between them.*

## What this changes for a multi-storefront network

Manifold has one shared catalog and many independent storefronts. A player can discover a game through one Store, while the game itself comes from a studio and the checkout runs through Manifold.

The Store never needs to receive or route the player's money. The intended Merchant of Record model keeps the consumer transaction central, while the Ledger records what the supplier is owed, what the referring Store earned, and what remains for the platform. Each party gets a view scoped to what it is entitled to see; the balancing rule underneath is the same for everyone.

### Example: the same game sold by two Stores

A $30 game sold through a Store earning the default 10% commission can produce: customer `+$30`, supplier `−$21`, Store `−$3`, platform `−$6`. If another Store has a negotiated 12% commission, the same $30 price can produce: customer `+$30`, supplier `−$21`, Store `−$3.60`, platform `−$5.40`. Different commercial terms, same invariant: both entry sets total zero.

The records can also support different views without creating different versions of the truth. In the example above, the Store statement can show its $3 commission and whether it is held or payable. The studio can see the sale of its game without receiving the player's identity. The platform can see the full gross and distributions. Each view is narrower, but all of them are derived from the same balanced entries.

That is the real trust benefit. A larger number of storefronts does not require a larger number of private spreadsheets, payout formulas, or informal reconciliations. It requires one rule that every money movement must satisfy before it becomes a fact.

## Where this stands today

The bookkeeping layer is already implemented: the append-only schema, the per-currency zero-sum validation, reversal behavior, commission maturation, sale entry sets, and Store statements all exist and are covered by automated tests.

The real payment-provider and payout rails are not finished yet. Today, the ledger is attached to the acquisition flow; it is not a claim that production checkout and bank payouts are live. That distinction matters. We have built the accounting invariant first so the money-moving layer will have a system of record that refuses to lose track of money by construction.

### What works versus what is still being built

Today, the system can assemble a sale's four entries, reject an unbalanced set, reverse a sale, hold a Store commission, and calculate Store statements in tests and the acquisition flow. It cannot yet claim that a card payment has been processed and the resulting payout has landed in a Store's bank account. Provider adapters and payout runs are the next layer.

That is the commitment: no financial event becomes part of Manifold's books unless every movement is accounted for, exactly, in the currency where it happened.
