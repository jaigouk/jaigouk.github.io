---
title: "Message queues"
description: "Nats vs Kafka vs etc. comparing message queues"
date: 2018-09-02
tags:
  - architecture
author: Jaigouk Kim
draft: false
---

Message queues are the backbone of your services.

If you have gone through MVP and passed the monolithic situation, you are probably thinking about something has to be done. There are lots of problems on the table. Especially, your organization has grown more than 15 devs, then it's possible that they want to use python for ML, golang for infrastructure, elixir for graphql api endpoint, etc. There are various ways to make it happen. grpc can be 1 possibility. Or, you can use message ques. After booming of mobile apps and IOT, the server side should be scalable and maintainable. And it's true that you can't just stick with 1 programming language and treat it as a silver bullet. Docker was the answer to that chaos and kubernetes is the winning orchestration tool. still, you need to figure out how to break things down and put them in kubernetes. Openfaas is using Nats-streaming and there are [multiple options(kafka, aws sns, CloudEvents, RabbitMQ)](https://docs.openfaas.com/reference/triggers/) to trigger your serverless functions.

While investigating message queue options out there, I found that [Kafka is used at NYT](https://www.confluent.io/blog/publishing-apache-kafka-new-york-times/) and usually have more scores on HN.

I found that openfaas is a good example for using Nats Streaming. FAQ doc says it supports memory or data store for messages.

<!-- image unavailable: Screen-Shot-2018-09-01-at-15.18.20 (https://files.jaigouk.com/2018/09/Screen-Shot-2018-09-01-at-15.18.20.png) -->

And openfaas is using in memory store for messages. the following snippet is from openfaas' [docker-compose.yml](https://github.com/openfaas/faas/blob/master/docker-compose.yml#L76) file. you can find kubernetes config from [here](https://github.com/openfaas/faas-netes/blob/master/yaml/nats-dep.yml)

```yaml
nats:
    image: nats-streaming:0.6.0
    # Uncomment the following port mappings if you wish to expose the
    # NATS client and/or management ports
    # ports:
    #     - 4222:4222
    #     - 8222:8222
    command: "--store memory --cluster_id faas-cluster"
    networks:
        - functions
    deploy:
        resources:
            limits:
                memory: 125M
            reservations:
                memory: 50M
        placement:
            constraints:
                - 'node.platform.os == linux'
```

I wanted to "replay" messages if something goes wrong. and then I found this comment from this [PR in nats-queue-worker](https://github.com/openfaas/nats-queue-worker/pull/17#issuecomment-377000157)

> If you use a NATS Streaming server with memory store, it is true that if the server is restarted, since no state is being restored, the previously "connected" clients will stop receiving messages. Publishers would fail too since the server would reject published messages for unknown client IDs.  
> The streaming server and streaming clients communicate through some inboxes. When the Streaming server is restarted, since it lost that knowledge, it can't communicate with existing clients. Moreover, even internal subjects used to communicate between the server and its clients contain a unique id that won't be the same after the restart).

> Note: If the NATS Streaming server connects to a non-embedded NATS Server, then if the NATS Server itself is restarted, that is fine, the client library's use of the underlying NATS connection will reconnect and everything would work fine (some timeout may occur for the operations that were inflight when the NATS server was restarted). This is because the Streaming server would still be running and its state maintained, so the communication can continue.

Now, I am curious if I change openfaas' nats-streaming config with PV like [this](https://github.com/canhnt/k8s-nats-streaming/blob/master/charts/nats-streaming-ft/templates/pv.yaml), then will openfaas fetch the previous messages even though the streaming server is down or nats-queue-worker is restarted? I will play with it and write the following up article.
