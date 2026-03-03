---
title: "istio"
description: "Istio service mesh on k3s rpi 4 cluster"
date: 2021-03-23
tags:
  - architecture
author: Jaigouk Kim
draft: false
---

notes while reading "istio in action"

> A service mesh is a distributed application infrastructure that is responsible for handling network traffic on behalf of the application in a transparent, out of process manner.  
> The service proxies form the "data plane" through which all traffic is handled and observed. The data plane is responsible for establishing, securing, and controlling the traffic through the mesh. The management components that instruct the data plane how to behave is known as the "control plane". The control plane is the brains of the mesh and exposes an API for operators to manipulate the network behaviors. Together, the data plane and the control plane provide important capabilities necessary in any cloud-native architecture

<!-- image unavailable: Screenshot_20210323-000033_Moon--Reader-Pro (https://files.jaigouk.com/2021/03/Screenshot_20210323-000033_Moon--Reader-Pro.jpg) -->

<!-- image unavailable: Screenshot_20210323-003057_Moon--Reader-Pro (https://files.jaigouk.com/2021/03/Screenshot_20210323-003057_Moon--Reader-Pro.jpg) -->

For helm v3.2.4 and k3s arm64 env,

```sh
helm repo add querycapistio https://querycap.github.io/istio
kubectl create namespace istio-operater
helm upgrade --install istio-operater querycapistio/istio-operator
```

output

```sh
Release "istio-operater" has been upgraded. Happy Helming!
NAME: istio-operater
LAST DEPLOYED: Fri Mar 26 17:43:16 2021
NAMESPACE: default
STATUS: deployed
REVISION: 4
TEST SUITE: None
```

for k3s, make sure traefik is not running

```
k3sup install --ip  xx.xx.xx.xx \
        --user my_user \
        --ssh-key ~/.ssh/my_key \
        --ssh-port 22  \
        --k3s-extra-args "--disable traefik"

# ssh to the server 
sudo rm /var/lib/rancher/k3s/server/manifests/traefik.*

k3sup join --server-ip xx.xx.xx.xx \
        --ip yy.yy.yy.yy \
        --user my_user \
        --ssh-key ~/.ssh/my_key \
        --ssh-port 22
```

use [istio-system](https://github.com/querycap/istio/tree/master/deploy/istio-system) directory to deploy via [kustomize](https://kubernetes.io/docs/tasks/manage-kubernetes-objects/kustomization/)

```sh
kubectl apply -k <kustomization_directory>
```

after this, manually change nodeAffinity in deployment. remove other arch values and change value to arm64 for istio-ingressgateway and istio-egressgateway deployments.

```yaml
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
              - matchExpressions:
                  - key: kubernetes.io/arch
                    operator: In
                    values:
                      - arm64
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 2
              preference:
                matchExpressions:
                  - key: kubernetes.io/arch
                    operator: In
                    values:
                      - amd64
```

<!-- image unavailable: istio-deployment (https://files.jaigouk.com/2021/03/istio-deployment.png) -->
