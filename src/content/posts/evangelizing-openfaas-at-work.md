---
title: "evangelizing openfass at work"
description: "personal experience about spreading openfaas at work"
date: 2018-09-07
tags:
  - architecture
author: Jaigouk Kim
draft: false
---

My motivations to use openfaas were,

- learning tool for new languages
- getting used to kubernetes
- learn serverless architecture with no cost for aws

I gave a tech talk to other developers at work with a demo and some people asked me to form a workshop. So, I cloned [openfaas workshop repo](https://github.com/openfaas/workshop/) and I got a permission from head of engineering to go through it 1 hour per week. In the beginning there were 17 devs. as time passes, people were not able to attend it because they were simply busy with their work.

Some people followed the lab notes if they were not able to attend the workshop. we have following lab note structure.

```
## Lab 5 - Create a Gitbot

[official openfaas lab5 note](https://github.com/openfaas/workshop/blob/master/lab5.md)


** feel free to update our notes.**

TOC

1. following the offical lab note
2. what we learned
3. ref
```

After 10th workshop session is done, i wanted to push this to the next phase. But there were concerns about openfaas from other devs. It's still young and people didn't want to use it for our production environment. But it is ok to use it for internal tools. Not used for production but the impact can be huge based on the problem I tackle. Luckily, head of frontend team was enthusiastic about using openfaas. Because i told him that i was able to write graphql functions that are connected to Neo4j. It needs to be polished but i was able to show the working query.  The guy had a real problem. It was about having lots of PRs that are hanging for a long time. The repository is a legacy codes. And people hate to dive into legacy codes. Well, as a "smart developer", you can find ways to avoid the situation. in the end, the legacy repository ended up with those PRs that are waiting people to review and QA. It's not about serverless architecture. it's about code ownership and having a solid CI/CD work process. I suggested him to form a plan to do that. git-ops can be a candidate if it's well crafted with QA steps.

There might something I can help. And then I remembered OpenFaaS community is using [Derek](https://github.com/alexellis/derek) - a serverless 🤖 to manage PRs and issues.

If we add more "pipe lines" that makes sense to the frontend team, then we can use it to improve our daily work process. Yes, I agree that it's more about people problem. but it will accelerate the plan. Now, I found a chance to use openfaas at work at last. Good thing about my situation is that our backend will be broken into services and we're going to use kafka as our message queue. And it's possible to launch openfaas function with kafka-connector. ([you can trigger your functions via sns, rabbit mq and cloud events too](https://docs.openfaas.com/reference/triggers/))

People will see it working and feel good about derek and automation for chores. If people start to add more features or functions then they might want to replicate the experience for production environment. we can do it with "stable" service like aws lambda in the beginning but it will cost money. then openfaas is a good option. isn't it?
