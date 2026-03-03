---
title: "OpenFaaS on Tinker board Cluster"
description: "I wanted to play with serverless architecture but I didn't want to spend money"
date: 2018-02-16
tags:
  - devops
  - architecture
author: Jaigouk Kim
draft: false
---

I wanted to play with serverless architecture but I didn't want to spend money before I get used to the concept. 1 year ago, I tried to do that and ended up using all credits on aws. What would be the cheaper way to learn it? I have been exploring the options. rpi is good but it only has 1GB ram. And then, I encountered asus tinker board. So, I gave it a shot. I bought 3 tinker boards(ARM-Cortex-A17 4x 1.8GHz, 2GB RAM, WLAN, Bluetooth) and 32GB sd cards and etc. I spend 303 euros.

I followed Karol Stepniewski's [blog post](http://blog.kars7e.io/2018/01/14/Kubernetes-cluster-on-ARM-using-Asus-Tinkerboard/?utm_content=buffer69682&utm_medium=social&utm_source=twitter.com&utm_campaign=buffer) and [forked his repo](https://github.com/jaigouk/tinker-cluster). I used latest armbian image and Network part was fine opposed to his blog post.

![result](https://pbs.twimg.com/media/DWKzLBUXkAIBsUf.jpg:large)

Now, it's time to dig into OpenFaaS.
