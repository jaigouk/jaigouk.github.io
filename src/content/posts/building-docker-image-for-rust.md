---
title: "Building docker image for rust"
description: "there is a way to build docker image for rust"
date: 2022-05-05
tags:
  - rust
author: Jaigouk Kim
draft: false
---

In these days, I am playing with rust.

Before using cargo-chef, it took 30 min to build a image on raspberry pi 4. even with "AS" layers.

with <https://github.com/LukeMathWalker/cargo-chef>, the intial build time took almost same but after that, building image took 2m 30s. For beefy machines, it would be much faster but building arm64 images on rpi matters to me because I am using k3s env as my homelab deployment environment.

```
FROM rust:1.60.0 AS chef
# We only pay the installation cost once,
# it will be cached from the second build onwards
RUN cargo install cargo-chef
WORKDIR /app

FROM chef AS planner
COPY . .
RUN cargo chef prepare  --recipe-path recipe.json

FROM chef AS builder
COPY --from=planner /app/recipe.json recipe.json
# Build dependencies - this is the caching Docker layer!
RUN cargo chef cook --release --recipe-path recipe.json
# Build application
COPY . .
ARG DATABASE_URL="postgres://username:xxxx@127.0.0.1:5432/myapp_production?sslmode=disable"
ENV DATABASE_URL="${DATABASE_URL}"

ARG TEST_DATABASE_URL="postgres://username:xxx@127.0.0.1:5432/myapp_service_ci?sslmode=disable"
ENV TEST_DATABASE_URL="${TEST_DATABASE_URL}"

RUN cargo build --release --bin ssr

# We do not need the Rust toolchain to run the binary!
FROM debian:bullseye-slim AS runtime
# Application dependencies
# We use an external Aptfile for this, stay tuned
COPY Aptfile /tmp/Aptfile
RUN apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get -yq dist-upgrade && \
  DEBIAN_FRONTEND=noninteractive apt-get install -yq --no-install-recommends \
    $(grep -Ev '^\s*#' /tmp/Aptfile | xargs) \
    && apt-get clean \
    && rm -rf /var/cache/apt/archives/* \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* \
    && truncate -s 0 /var/log/*log

# I use dbmate to mantain db migrations
RUN wget --no-check-certificate https://github.com/amacneil/dbmate/releases/download/v1.15.0/dbmate-linux-arm64 \
  && mv dbmate-linux-arm64 /bin/dbmate \
  && chmod +x /bin/dbmate
  
WORKDIR /app
COPY --from=builder /app/target/release/ssr .
RUN mkdir static && mkdir db
COPY --from=builder /app/static ./static/
COPY --from=builder /app/db ./db/

ARG HOST_PORT="0.0.0.0:3000"
ENV HOST_PORT="${HOST_PORT}"

ARG LOG_LEVEL="info"
ENV LOG_LEVEL="${LOG_LEVEL}"

ENV DATABASE_URL="${DATABASE_URL}"
ENV TEST_DATABASE_URL="${TEST_DATABASE_URL}"

EXPOSE 3000

CMD ["/bin/bash"]
```
