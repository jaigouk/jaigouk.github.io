---
title: "grpc"
description: "The ultimate glue for microservices"
date: 2016-10-17
author: Jaigouk Kim
draft: false
---

The ultimate glue for microservices

I am playing with grpc on kubernetes in these days. My starting point is  
[nginx-kubernets-lb](github.com/thesandlord/nginx-kubernetes-lb). I wanted to start from small and light solution. But heroku was not an option to play with this. So I had to setup kubernetes on aws. I deployed `Deis` too. It took some time to be able to reproduce the production env. This blog is also running on kubernetes. Now, I am ready to play!

#### main resources

- <http://www.grpc.io/>
- <https://github.com/grpc/>
- videos - <https://www.youtube.com/playlist?list=PLcTqM9n_dieM6M4lgL9qdu-UridiVe8Gx>
- gRPC: The Story of Microservices at Square -> <https://www.youtube.com/watch?v=-2sWDr3Z0Wo>
- Real-time IoT with Containers and gRPC (<https://www.youtube.com/watch?v=nz-LcdoMYWA> ) (<https://github.com/grpc-ecosystem/grpc-simon-says>)
- <https://github.com/thesandlord/samples/tree/master/grpc-kubernetes-microservices> , video : <https://www.youtube.com/watch?v=UOIJNygDNlE>, slide: <https://speakerdeck.com/thesandlord/building-scalable-microservices-with-kubernetes-grpc-and-containers-api-world-2015>
- Creating a scalable API with microservices(<https://cloudplatform.googleblog.com/2016/06/creating-a-scalable-API-with-microservices.html>)
- Kelsey Hightower - Building Microservices with gRPC and Kubernetes (<http://www.ustream.tv/recorded/86187859>)
- <http://dbeck.github.io/5-lessons-learnt-from-choosing-zeromq-and-protobuf/>
- <http://blog.jonharrington.org/elixir-and-czmq/>
- <https://github.com/jbavari/elixir-zeromq-protobuf-uploader>

#### caution

- ruby gem - download ruby gem instead of installing grpc
- heroku - not suitable for grace. heroku does not support http2. grpc needs that.(<https://devcenter.heroku.com/articles/http-routing>)

#### deploy

<https://cloudplatform.googleblog.com/2016/08/gRPC-a-true-Internet-scale-RPC-framework-is-now-1-and-ready-for-production-deployments.html>

##### 1. ruby

<http://www.grpc.io/docs/quickstart/ruby.html>

##### 2. node.js

<http://www.grpc.io/docs/quickstart/node.html>

##### 3. elixir

<https://speakerdeck.com/tony612/the-way-to-grpc-elixir>  
<https://github.com/tony612/grpc-elixir>

##### heroku

<https://github.com/kyleconroy/heroku-buildpack-grpc>

##### polyglot

<https://github.com/grpc-ecosystem/polyglot>

Polyglot is a grpc client which can talk to any grpc server. In order to make a call, the following are required:

- A compiled Polyglot binary,
- the .proto files for the service,
- and a request proto instance in text format.

In particular, it is not necessary to generate grpc classes for the service or to compile the protos into the Polyglot binary.

- Supports unary, client streaming, server streaming, and bidi streaming rpcs.
- Runs on Windows, Mac and Linux.
- Parses proto files at runtime to discover services. Supports pretty-printing discovered services.
- Supports authentication via oauth.
- Accepts request protos through stdin and can output responses to stdout to allow chaining.
