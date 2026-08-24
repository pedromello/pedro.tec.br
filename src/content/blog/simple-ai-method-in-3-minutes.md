---
title: "Simple AI Method in 3 minutes"
description: "Understand prediction, classification and linear regression through a concise house-pricing example that introduces a foundational AI method."
seoTitle: "Linear Regression Explained in 3 Minutes | Pedro Mello"
seoDescription: "Learn prediction, classification and linear regression through a concise house-pricing example that introduces a foundational machine-learning method."
publishedAt: 2025-01-08
updatedAt: 2025-01-14
category: "AI & Applied Research"
tags: ["AI","Computer Science"]
cover: "/images/posts/simple-ai-method-in-3-minutes/cover.webp"
coverAlt: "Linear regression line illustrating a simple machine-learning prediction method"
sourceUrl: "https://pedro.tec.br/simple-ai-method-in-3-minutes/"
draft: false
---
Machine learning is an area of computer science responsible for products that amaze everyone. From Instagram filters to cancer predictions, artificial intelligence is present in a variety of services around the world. For those interested in a brief understanding of how AI works, this article is for you!

**So let’s get started!**

First of all, there are numerous problems that can be solved by AI methods and many of them fall into one of these categories:

## **Prediction Problems or Classification Problems?**

For prediction problems, we try to predict a value by looking at a set of characteristics. eg: Price of a smartphone based on its features and brand.

Classification Problems on the other hand we want to label our data based on characteristics we know similar data might have. eg: Determine if a tumor is benign or malignant based on the tumors we know so far.

We will be focusing on the prediction one now.

## **House pricing problem and the linear regression**

House pricing is a basic problem that we can use to understand how some prediction methods work. We will implement linear regression, a simple yet powerful prediction method.

![](/images/posts/simple-ai-method-in-3-minutes/1_p55mr5v4r1c7mtsgivhnqa.webp)

Suppose someone gives you this House Prices data and asks you to determine the price of the blue house. (the blue dot we see above) Where would you place this blue dot?

Maybe you would put it somewhere close to where I put it.

![](/images/posts/simple-ai-method-in-3-minutes/1_drv2qrqhr7rhxpdoxfbr9w.webp)

But why do we think this might be a good stop to place this good-looking dot? Maybe you realized that sq.ft and price have a linear correlation. (wait, linear what?)

[**Linear correlation**](https://www.statlect.com/fundamentals-of-probability/linear-correlation#:~:text=Linear%20correlation%20is%20a%20measure,of%20covariance%20\(see%20here\).) is a measure of dependence between two variables. In this case, when sq.ft grows in number the price grows as well. Basically, whenever you see a line pattern in a graph, the data could be said to have a linear correlation.

Because of this, we may plot a simple line on this graph that approximates all the dots. And our blue dot would be placed on this line.

![](/images/posts/simple-ai-method-in-3-minutes/1_fs9yhapw61ozxu__yx_2kq.webp)

Ok, but what does this have to do with AI? Well.. everything! AI methods try to find patterns in data just like we just did. In the case of linear regression, the computer uses math to try to calculate the best-fit “line” that can be used to place unknown values with the least error possible.

## **Conclusion**

AI has become an integral part of our lives, with numerous applications. Predictive problems are one of the main categories in which AI methods can be employed. Linear regression, a simple yet powerful prediction method, can be used to solve a variety of problems such as house pricing, patient outcomes prediction in healthcare, team performance prediction in sports, and voting behavior analysis in social sciences. While linear regression is not fit for all purposes, it is an important tool in AI that can help us solve complex problems in various domains.

There are a lot of other just-as-interesting methods out there being used to do amazing things. In future posts, we could explore some of these methods and their potential applications, all in just three minutes!
