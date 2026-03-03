---
title: "hosting ghost blog with static pages on github"
description: "hosting ghost blog via github static pages. It can be done via gssg tool while hosting it locally on raspberry pi."
date: 2022-04-18
tags:
  - tools
  - devops
author: Jaigouk Kim
draft: false
---

I am hosting my ghost blog on github static page. but I am writing blog posts with ghost instance on rpi.

```sh
[Unit]
Description=gssg ghost publishing service
After=network.service
Requires=network.service

[Service]
TimeoutStartSec=10
Restart=always
User=myuser
Group=myuser
WorkingDirectory=/home/myuser/static-ghost/ghost-publisher
ExecStart=/home/myuser/.cargo/bin/cargo run --bin gssg

[Install]
WantedBy=multi-user.target
```

gssg is a simple rust actix-web service that triggers [gssg](https://github.com/Fried-Chicken/ghost-static-site-generator) in raspberry pi and then pushes to github pages. This is a faktory consumer.

There is another web hook service that is acting as a faktory producer. Because gssg takes time to fetch blog posts and pushing also takes time, this should be done as a long running background job.

here is the webhook part

```rust

    use actix_web::{get, post, web, App, HttpResponse, HttpServer, Responder};

    use faktory::{Producer, Job};
    use std::io::{self, Write};

    #[get("/")]
    async fn root() -> impl Responder {
        HttpResponse::Ok().body("root")
    }

    #[get("/health")]
    async fn health() -> impl Responder {
        HttpResponse::Ok().body("fine")
    }

    #[get("/gssg")]
    pub async fn gssg_handler() -> impl Responder {
        let mut p = Producer::connect(Some(FAKTORY_URL)).unwrap();

        p.enqueue(Job::new("gssg", vec!["rust"])).unwrap();
        HttpResponse::Ok().json("Ok")
    }

    #[actix_rt::main]
    async fn main() -> std::io::Result<()> {
        println!("Starting Web server");

        HttpServer::new(|| {
            App::new()
                .service(root)
                .service(health)
                .service(gssg_handler)
        })
        .bind(("0.0.0.0", 3001))?
        .run()
        .await
    }
```

and gssg bin. here I am using gssg queue which is same as above.

```rust
extern crate execute;
use std::process::Command;
use execute::Execute;

use faktory::ConsumerBuilder;
use std::io;


fn main() {
    let mut c = ConsumerBuilder::default();
    c.register("gssg", |job| -> io::Result<()> {
        println!("{:?}", job);

        const GSSG_PATH: &str = "/home/myuser/static-ghost/deploy/update-blog.sh";
        let mut command = Command::new(GSSG_PATH);
        let output = command.execute_output().unwrap();
        if let Some(exit_code) = output.status.code() {
            if exit_code == 0 {
                println!("Ok.");
                Ok(())
            } else {
                eprintln!("Failed.");
                Ok(())
            }
        } else {
            eprintln!("Interrupted!");
            Ok(())
        }
    });

    let mut consumer = c.connect(Some(FAKTORY_URL)).unwrap();

    if let Err(e) = consumer.run(&["default"]) {
        println!("worker failed: {}", e);
    }

}
```

updating blog via gssg

```bashscript
 #!/bin/bash

    rm -rf /home/myuser/github-user.github.io

    cd /home/myuser
    git clone git@github.com:github-user/github-user.github.io.git

    cd /home/myuser/github-user.github.io
    git pull
    rm -rf /home/myuser/github-user.github.io/docs

    /home/myuser/.npm-global/bin/gssg --dest /home/myuser/github-user.github.io/docs --domain http://local-ip:2368 --url https://mydomain.com

    echo "mydomain.com" > /home/myuser/github-user.github.io/docs/CNAME
    echo "blog.mydomain.com" >> /home/myuser/github-user.github.io/docs/CNAME
    echo "www.mydomain.com" >> /home/myuser/github-user.github.io/docs/CNAME

    git config user.name "My Name"
    git config user.email "my@email.com"

    date > updated_at

    git add .
    git commit -m "updated on `date +'%Y-%m-%d %H:%M:%S'`"
    git commit --amend --author="My Name <my@email.com>" --no-edit

    git push -f
```
