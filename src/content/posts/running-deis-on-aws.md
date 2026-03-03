---
title: "running deis on AWS"
description: "(Deis + Kubernetes + AWS) for the win"
date: 2016-10-18
tags:
  - architecture
  - devops
author: Jaigouk Kim
draft: false
---

(Deis + Kubernetes + AWS) for the win

I like to use deis because I can deploy my projects just like heroku while I can play with kubernetes. So I setup deis on aws. I wanted to use http2 and I can't use http2 ports on heroku.

3 Steps

1. deploy kubernetes with [tack](https://github.com/kz8s/tack)
2. install deis with helmc
3. setup DNS and Letsencrypt certs

#### tack

I used <https://github.com/kz8s/tack> for setting up kubernetes on AWS.

1. check `~/.aws/config` region
2. change name of region in `Makefile` after running `make clean`
3. if kubectl is not working, check the path of `tack/.cfssl` or `tack/.keypair`
4. in `io.tf` you can change kubernetes version. visit "quay.io/coreos/hyperkube" and check the latest tag.
5. in `~/.kube/config`, there would be settings for previous builds.
6. check `~/.helmc` and delete cache and workspace folders. (in case you changed the path of `tack`)

#### Deis

we are gong to use [Helm](https://github.com/kubernetes/helm) to manage packages for kubernetes.

```
curl -sSL http://deis.io/deis-cli/install-v2.sh | bash
mv deis /usr/local/bin
curl -sSL https://get.helm.sh | bash

mv $PWD/helmc /usr/local/bin/helmc
helmc target # Ensure the kubectl client is installed and 
			 # can connect to your Kubernetes cluster.
```

CAUTION. UPDATE ROLES TO worker and master role. then visit <https://console.aws.amazon.com/iam/home?region=ap-southeast-1#roles>. Add ec2, rds, s3, ecs roles to worker .

if you want to change config for workflow, check deis-s3-db-registry folder

```
helmc fetch deis/workflow-v2.7.0            # fetches the chart into a
											# local workspace
```

At this point, You may want to configure s3 and postgres for deis.  
<https://deis.com/docs/workflow/installing-workflow/configuring-postgres/>

On aws, after creating the postgres db, add a inboud rule to the security group like this so that local machine or deis can connect to it.

```
Security Group Rules - Edit inbound rules
TCP 5432 Anywhere 0.0.0.0/0
```

For s3, Ater creating 3 bukcets, you need to add more permission to the IAM role. visit <https://console.aws.amazon.com/iam/home?region=ap-southeast-1#roles> and add s3 related permissions to worker-k8s-rpc, master-k8s-rpc  
currently, I am not using ecr for registry. For custom domains, you may want to add route53 related permissions to those roles too.

If you want to use ecr then visit <https://ap-southeast-1.console.aws.amazon.com/ecs/home?region=ap-southeast-1#/firstRun> and setup cluster then change the `~/.helmc/workspace/charts/workflow-v2.7.0/tpl/generate_params.toml` file.

change s3 or rds related config before you run `generate`

```
helmc generate -x manifests workflow-v2.7.0 # generates various secrets
helmc install workflow-v2.7.0               # injects resources into
											# your cluster
kubectl --namespace=deis get pods #-> should return more than 10 pods
```

Configure your AWS Load Balancer for `git push`. Set the timeout to 3600.  
[configuring a load balancer¶](https://deis.com/docs/workflow/managing-workflow/configuring-load-balancers/)

```
kubectl --namespace=deis annotate deployment/deis-router router.deis.io/nginx.useProxyProtocol=true

 kubectl --namespace=deis annotate service/deis-router service.beta.kubernetes.io/aws-load-balancer-proxy-protocol='*'
```

and then register to your server

```

deis register http://deis.example.com
admin / ****** 
```

add ssh `deis keys:add`. For setting up DNS records, check the following section.

#### Naked domain for a deis project

I have several domains for projects. let’s say 2 for deis hub and 1 for my project. Assume that example.com is our project and root.io and root.co are my hub domains. I am using AWS and Cloudflare to achieve naked domain.

add domains to the repo

```
  deis domains:add example.com
  deis domains:add www.example.com
  deis domains:add unbent-backbone.root.io
```

add a url forwarding page rule: match "www.example.com/*" with "<https://example.com/$1>"

```
  # DNS Setup for example.com on cloudflare
  CNAME www             unbent-backbone.root.io  (orange)
  CNAME @               unbent-backbone.root.io  (orange)

  # DNS Setup for root.io on cloudflare
  CNAME @               hub.root.co      (!! NO ORANGE)
  CNAME deis            hub.root.co      (orange)
  CNAME deis-builder    hub.root.co      (!! NO ORANGE)
  CNAME unbent-backbone hub.root.co      (orange)
```

setup the alias for elb

```
  # DNS Setup for root.co on AWS Route53
  A hub.root.co Alias Target dualstack.xxx.ap-southeast-1.elb.amazonaws.com
```

#### Letsencrypt

1. do nothing for aws elb
2. use cloudflare for https assets
3. use `kube-cert-manager`.based on <https://github.com/PalmStoneGames/kube-cert-manager>, it works. I just had to change `psg` to my domain in the project files. and build `kube-cert-manager`executable file. And then I build the docker image and published it.

#### Uninstall / Reinstall

if you are going to reinstall, do not delete elb.

```
	cd .helmc
	helmc uninstall workflow-v2.7.0 -n deis
	cd tack
	make clean
```

check vpc, elb, s3 buckets  
change the name of instance in tack's Makefile  
before install, check to regions in ~/.aws/ and ~/.deis and tack's Make file  
or any ENV vars. ~/.zsh_aliase has ENV var to access AWS!
