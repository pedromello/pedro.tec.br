---
title: "Study on DeFi and Private Credit Liquidity"
description: "A technical study of DeFi liquidity models, private credit markets, lending protocols and the risks involved in connecting them."
seoTitle: "DeFi and Private Credit Liquidity | Pedro Mello"
seoDescription: "Explore DeFi liquidity models, private credit markets, lending protocols and the technical risks involved in connecting on-chain and private assets."
publishedAt: 2025-05-29
updatedAt: 2025-06-02
category: "FinTech & DeFi"
tags: ["DeFi","Innovation","Lending Protocols","RWA","Study"]
cover: "/images/posts/study-on-defi-and-private-credit-liquidity/cover.webp"
coverAlt: "DeFi liquidity connected to private credit markets and lending protocols"
sourceUrl: "https://pedro.tec.br/study-on-defi-and-private-credit-liquidity/"
draft: false
---
**Author’s & Translator’s Note:** I originally wrote this study in Portuguese. This English version has been translated with the assistance of artificial intelligence. You can find my original Portuguese article [here](https://goassets.io/estudo-sobre-defi-e-liquidez-em-credito-privado/).

## Introduction

Liquidity in the private credit market is one of the most significant challenges for investors and companies seeking financing outside the traditional banking system. Unlike bank credit, where there is a centralizing intermediary, private credit allows for more flexible and personalized operations. However, it faces difficulties in quickly converting assets into cash without significant losses.

In recent years, innovative solutions have emerged to increase liquidity in this sector, combining elements of the traditional financial market with new decentralized technologies. Protocols like **Aave**, **Compound**, and **Goldfinch** have developed efficient mechanisms to offer liquidity to investors and borrowers, enabling automated and transparent asset trading.

This study aims to explore these approaches and evaluate how they can be applied in the context of **goAssets**. By analyzing established market models, we seek to identify the most relevant elements for developing an efficient liquidity system for private credit, ensuring greater security and predictability for investors.

## Fundamental Concepts

### Private Credit

Private credit refers to financing operations conducted outside the traditional banking system. Companies and investors access capital directly through investment funds, corporate debt issuance, or structured loans, reducing bureaucracy and expanding financing opportunities.

### DeFi (Decentralized Finance)

DeFi is a set of financial services that operate without traditional intermediaries, such as banks, using blockchain and smart contracts. This allows anyone in the world to access products like loans, investments, and transactions transparently and automatically. Protocols like Aave, Compound, and Goldfinch use this technology to connect investors looking to generate yield on their capital with companies or individuals needing credit.

### Liquidity Pools

A liquidity pool is a collective fund where investors deposit their capital so it can be used for loans. In protocols like Aave, Compound, and Goldfinch, these pools function as “decentralized banks,” where anyone can provide money to be lent to third parties and, in return, receive interest.

Instead of an investor lending directly to a specific borrower, they deposit resources into the pool, which then automatically distributes this money across various loans. The interest paid by borrowers is shared among all investors in the pool. This model reduces individual risks and ensures greater liquidity, as investors can redeem their money without waiting for a specific loan to mature.

### Liquidity Providers

Liquidity providers are investors who deposit their assets into a liquidity pool, allowing this money to be used for loans. In return, they receive interest and rewards proportional to the capital invested. This model facilitates credit granting and ensures there is always money available for loans and withdrawals.

### AMM (Automated Market Maker)

AMMs are systems that automate the buying and selling of assets on decentralized platforms, eliminating the need for a traditional order book. They automatically adjust interest rates based on supply and demand within the liquidity pool, ensuring that loans are sustainable and balanced.

To better understand how an AMM works, we recommend watching this video – [What is an Automated Market Maker?](https://www.youtube.com/watch?v=1PbZMudPP5E) "What is an Automated Market Maker?")

### APY (Annual Percentage Yield)

APY includes the effects of compounding, reflecting a higher effective return over time. For example, if an investment offers a 10% annual return and the interest is compounded monthly, the final yield will be greater than 10% due to the periodic reinvestment of earnings. This means an investor who applies $1,000 with an APY of 10% per year will have a balance greater than $1,100 at the end of the period due to interest compounding.

## Market Analysis and Trends

Before developing a proof of concept (PoC) for the proposed system, we conducted a market analysis to understand how other companies are addressing this problem. Among the various initiatives studied, three stood out for presenting approaches aligned with goAssets’ objectives.

### [Aave](https://aave.com/)

Aave presents itself as one of the largest liquidity protocols in the world, managing over $31 billion. Although it uses the term “liquidity pool,” its approach to private credit loans works differently than usual.

**Key aspects of the Aave protocol:**

-   **Markets and Token Reserves:** Unlike a conventional liquidity pool where two assets are paired, Aave operates through credit “markets.” Each market contains several token reserves. There is a single market for each blockchain where the protocol is present. Within each market, there are different reserves of assets accepted for loans. For example, in the Ethereum market, there are reserves of USDC, WBTC, DAI, among others. An investor can deposit their USDC into this specific reserve and, in return, receive interest on their investment.
-   **Auto-Scaling Token:** Another Aave differentiator is the issuance of collateral tokens called aTokens. When investing in the protocol, the user receives these tokens in a 1:1 ratio to the invested value. For example, by depositing 100 USDC, the investor receives 100 aUSDC. Over time, these tokens automatically increase in value as interest is applied to the balance. The aToken mechanism allows the investor’s balance to grow without the need for manual reinvestment. The token’s smart contract itself calculates the earnings and adjusts the balance proportionally.
    -   **Practical example:** John invested 100 USDC on January 1st and received 100 aUSDC. After six months, with an accumulated rate of 10%, he now has 110 aUSDC. When redeeming his tokens, he can exchange them in the Aave reserve for 110 USDC, earning a profit of 10 USDC.
-   **References:**
    -   [Aave aToken Explanation](https://aave.com/docs/developers/smart-contracts/tokenization)
    -   [Auto-Scaling Token .sol code](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/protocol/tokenization/base/ScaledBalanceTokenBase.sol)

### [Compound](https://compound.finance/)

Compound is an EVM-based protocol that allows users to provide digital assets as collateral to obtain loans. Additionally, those who provide liquidity to the protocol can receive interest on their deposited assets. Initially launched on the Ethereum network, the protocol uses USDC as the base asset for loans and collateral.

**Key aspects of the Compound protocol:**

Similar to Aave, Compound works with the concept of markets but with a slightly different structure. While Aave has a single market per network, Compound defines specific markets for each network and asset combination. This means different markets can have distinct rules regarding collateral acceptance. For example, the Ethereum+USDC market might accept DAI as collateral, while the Ethereum+USDT market might not.

Compound also adopts an auto-scaling token mechanism, similar to that implemented by Aave. This model allows user balances to increase automatically as interest is generated. For calculating return rates, the protocol uses two main indicators: Supply Rate and Borrow Rate.

-   **References:**
    -   [Compound Tutorials](https://compound-1.gitbook.io/compoundtutorials/chapter-2-markets-utilization-and-interest-rates/5.-supply-and-borrow-interest-rates-vs.-utilization-rate-chart)
    -   [Compound contracts .sol codes](https://etherscan.io/address/0xaec1954467b6d823a9042e9e9d6e4f40111069a9#code)

### [Goldfinch](https://www.goldfinch.finance/)

Goldfinch is a decentralized protocol focused on private credit that seeks to offer accessible financing to real-world businesses. Unlike other protocols that require on-chain collateral, Goldfinch allows companies to obtain loans without needing digital assets as collateral, relying on a trust and due diligence model to enable financing. See the protocol diagram [here](https://dev.goldfinch.finance/assets/images/architecture-2487ca25b67dc0efe19d1726233825d5.png).

**Key aspects of the Goldfinch protocol:**

**Two-Tier Pool and Loan Flow:** Goldfinch uses a pool approach as a token reserve, much like Aave and Compound, but it employs a two-tier pool system: **Senior** and **Junior**.

The Senior layer has only a single pool where most investors invest their money. The money from this pool is subsequently invested in Junior pools that have undergone prior validation.

The Junior layer can have numerous pools as they are created by “Originators.” The step-by-step process is as follows:

1.  The Originator submits a loan proposal, which generates a new “loan pool.” Each loan pool represents an Originator’s credit line. At this stage, the Originator must share legal agreements, the structure, and due diligence of the credit line.
2.  Backers (investors who want to participate more actively and support the protocol) conduct due diligence on this new loan pool and validate the origination. They can also suggest changes to interest settings or pool size. After validation and agreement, Backers make the first investment in this pool.
3.  After validation and investment by Backers, the Senior Pool automatically allocates money to this approved loan pool.
4.  With the investment made, the Originator can withdraw the borrowed money (all investment is made in USDC).

**FIDU Token as Liquidity Provider Token**

FIDU is Goldfinch’s Liquidity Provider token. When an investor deposits USDC into the Senior Pool, they receive FIDU in return, functioning as a receipt for the investment. The value of FIDU grows as returns generated by loans are reinvested into the pool, ensuring a sustainable appreciation model for investors.

**Share-Based Model**

Traditional pool models use an Automated Market Maker (AMM) to control token values in a pool. However, Goldfinch forgoes the AMM for a Share-Based Model strategy where the amount an investor withdraws is the number of LP tokens multiplied by the current `sharePrice`. Below is an example of the withdrawal flow to better understand this:

**Example**

We have 2 investors and 1 originator.  
`sharePrice` = 1 (i.e., 1 FIDU = 1 USDC)  
Interest rate of 10% per month  
Withdrawal fee of 1%

**Initially, we have 0 USDC and 0 FIDU in the system.**

1.  **Investor A deposits 1,000 USDC:**
    -   1,000 FIDU tokens will be generated for the investor. This number is given by (1,000 USDC / 1.0 `sharePrice`).
2.  **Investor B deposits 1,000 USDC:**
    -   1,000 FIDU tokens will be generated for the investor. This number is given by (1,000 USDC / 1.0 `sharePrice`).
3.  **The Originator borrows 2,000 USDC.**
4.  **After 1 month, the Originator repays the amount:**
    -   The payment is 2,000 USDC + 200 USDC (10% interest).
    -   The principal payment of 2,000 USDC goes directly to the pool.
    -   The interest payment is divided:
        -   10% is set aside for the fund’s reserve.
        -   90% goes to the original pool, totaling 2,180 USDC in the pool (initial 2000 – 2000 loan + 2000 repayment + 180 interest share).
5.  **With this, the `sharePrice` is updated:**
    -   Formula for the new `sharePrice`: New Share Price=Old Share Price+(Interest Distributed to Pool/Total FIDU Tokens)
    -   Applying the formula: 1.0+(180/2,000)=1.09 USDC per FIDU
    -   We have the new value of USDC per FIDU, which is 1.09.
6.  **Investor A withdraws their money:**
    -   They have 1,000 FIDU.
    -   1 FIDU = 1.09 USDC, so they withdraw 1,090 USDC.
    -   The withdrawal fee is 1%, which amounts to 10.9 USDC.
    -   Thus, the investor receives 1,079.10 USDC.
    -   The reserve receives 10.90 USDC.
    -   Now the pool has 1,090 USDC remaining (2180 total after interest – 1090 withdrawn by A).
7.  **Investor B withdraws their money:**
    -   Same logic as Investor A.
    -   Withdraws 1,000 FIDU \* 1.09 USDC/FIDU = 1,090 USDC.
    -   Fee: 10.9 USDC.
    -   Receives: 1,079.10 USDC.
    -   Reserve receives: 10.90 USDC.
8.  **Final Result:**
    -   Net profit for each entity:
        -   Investor A and B -> +79.10 USDC each
        -   Originator -> -200 USDC
        -   Goldfinch Reserve -> +41.80 USDC (10% of 200 interest = 20 USDC, plus 10.9 + 10.9 from withdrawal fees)

-   **References:**
    -   [.sol contract codes](https://etherscan.io/address/0x22225d74Bab7E0c7232864EaA0F143B30C811481#code)
    -   [Protocol Architecture](https://dev.goldfinch.finance/assets/images/architecture-2487ca25b67dc0efe19d1726233825d5.png)
    -   [Detailed Protocol Explanation](https://dev.goldfinch.finance/docs/reference/how-the-protocol-works)

## Liquidity Pool Implementation

After researching the relevant aspects of a DeFi credit system and conducting market research where we can see different approaches to solving this type of problem, we can say that the system that would best suit a global institutional lending model is one that incorporates aspects of **Goldfinch**, especially the **Share-Based Model** to control the interest users will receive. Creating a system based on the amount of interest received in the pool provides greater security for this type of model, where the withdrawal value for investors is only updated when the money is actually available. In **Aave** and **Compound** models, as this value increases dynamically, the system might end up needing to pay investors even before having the money from origination.

Although **Goldfinch’s** system is broad and robust, a simpler approach with just **one liquidity pool** instead of a more dynamic multi-layered structure is preferable for a PoC.

## Challenges and Risks

Implementing this system involves significant technical and operational challenges, but our future experience with investment funds will help understand and refine these mechanisms. The two main risks are:

-   **Share Price Management:** Precise control of the deposit token valuation is essential to avoid inconsistencies and ensure that yields are distributed correctly.
-   **Liquidity Management:** Ensuring there is always sufficient capital available for redemptions without compromising investor returns is a delicate balance, requiring well-structured strategies.

Despite these challenges, solid planning and an iterative approach will allow the system to evolve safely and efficiently.

## Conclusion

In summary, this study shows that DeFi solutions are transforming the private credit landscape by offering innovative alternatives to increase liquidity and market efficiency. The analysis of Aave, Compound, and especially Goldfinch protocols demonstrates how decentralization, combined with models like the Share-Based approach, can provide greater predictability and security for investors and borrowers. Although implementation requires special care in managing share price and liquidity, strategic planning and an iterative approach will allow for the gradual evolution of the system, democratizing access to private credit outside the traditional banking model and paving the way for a more dynamic and transparent market.
