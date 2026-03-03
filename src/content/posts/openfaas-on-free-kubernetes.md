---
title: "openfaas on ibm cloud"
description: "Do you need a free kubernetes env for playing with openfaas?"
date: 2018-08-24
tags:
  - devops
author: Jaigouk Kim
draft: false
---

# Openfaas on Kubernetes - cheapest options

**update(3 Sep 2018)** : updated installing openfaas on local kube part.

**Update(26 Aug 2018)** : I talked with Alex. He told me, "A single node on DigitalOcean with 4GB RAM should be quite cost effective, same with Scaleway using kubeadm. Minikube on your own system is also a good option or with Docker for Mac. (EKS is not cheap) - GKE might be one of the cheaper managed options"

There are many options to use openfaas. Mainly, docker swarm or kubernetes. Kubernetes formed into [Cloud Native Computing Foundation](https://www.cncf.io/). They also have [exam materials](https://github.com/cncf/curriculum) for [certified admin](https://github.com/walidshaari/Kubernetes-Certified-Administrator) / dev. There are still lots of companies out there using docker swarm as their container orchestration tool. But the trend clearly shows us that kubernetes won the battle. CNCF is the result. It's explicit and configurable. But the problem is installing and maintaining kubernetes on AWS is quite complicated. it takes some time to get used to all setup. With digitalocean, it's fairly easy compare to aws. And after september of 2018, they would release kubernetes as a service. At this point, the pricing page is not there. They might charge it based on droplets.

Then, what would be the optiono to get used to openfaas on kubernetes without spending any money? There are 2 options. local setup and ibm cloud. There are pros and cons. With local setup, it will eat up your resource. And you would not be able to show what you've been playing to other people. As long as you have enough resource, then this is ok. With IBM cloud, you need to switch to pay as you go plan. basically, you need to give them your credit card number. but the "lite" plan doesn't charge you for it. 4GB ram. and it expires in a month. And you can't use ingress. just NodePort. Public IP exists.

The ugly part of serverless thingy is the hidden cost as described [here](https://medium.com/coryodaniel/from-erverless-to-elixir-48752db4d7bc). Openfaas can limit the maximum cost while having the scalability. You have the control. No vendor lock in.

## Option1. Openfaas on local kuberneres

I assume you're using OS X.

```sh
brew install kubernetes-cli
brew install kubectx
```

Install kubernetes and dashboard by following this [github wiki page](https://github.com/kubernetes/dashboard/wiki/Accessing-Dashboard---1.7.X-and-above#api-server)

```sh
kubectl config set-context docker-for-desktop
kubectl config use-context docker-for-desktop
kubectx
kubectl get all
kubectl cluster-info
kubectl create -f https://raw.githubusercontent.com/kubernetes/dashboard/master/src/deploy/recommended/kubernetes-dashboard.yaml

kubectl describe services kubernetes-dashboard --namespace=kube-system
kubectl -n kube-system edit service kubernetes-dashboard
# edit .spec.type to NodePort
sudo kubectl proxy
```

visit [the local dashboard](http://localhost:8001/api/v1/namespaces/kube-system/services/https:kubernetes-dashboard:/proxy/)

get your token to login to the dashboard

```sh
kubectl create serviceaccount jaigouk
kubectl get serviceaccounts jaigouk -o yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  # ...
secrets:
- name: jaigouk-token-1yvwg
kubectl get secret jaigouk-token-6dztl -o yaml

echo xxxxx== | base64 --decode
```

install openfaas

The faas-netes controller is the most tested, stable and supported version of the OpenFaaS integration with Kubernetes. In contrast the OpenFaaS Operator is based upon the codebase and features from faas-netes, but offers a tighter integration with Kubernetes through CustomResourceDefinitions. This means you can type in kubectl get functions for instance.

```sh
kubectl apply -f https://raw.githubusercontent.com/openfaas/faas-netes/master/namespaces.yml

helm repo add openfaas https://openfaas.github.io/faas-netes/

helm repo update \
 && helm upgrade openfaas --install openfaas/openfaas \
    --namespace openfaas  \
    --set functionNamespace=openfaas-fn \
    --set operator.create=true

# generate a random password
export GW_PASS=$(head -c 16 /dev/random |shasum | cut -d ' ' -f1)

kubectl -n openfaas create secret generic basic-auth \
--from-literal=basic-auth-user=admin \
--from-literal=basic-auth-password=$GW_PASS

helm upgrade --reuse-values openfaas openfaas/openfaas \
    --set basic_auth=true

# verify it's running
kubectl --namespace=openfaas get deployments -l "release=openfaas, app=openfaas"

kubectl proxy

echo $GW_PASS | faas-cli login --gateway="127.0.0.1:31112" -u admin --password-stdin
```

visit <http://localhost:31112/ui/>  
username is admin and password is $GW_PASS value

if you have trouble, visit <https://github.com/openfaas/faas-netes/blob/master/chart/openfaas/README.md> for details

## Option2. Using kubernetes on IBM cloud

the IBM cloud gives us free 1 node kubernetes instance that expires in a month. As long as you automated everything then, it wouldn't be a big problem to play with it. For example, you can try ["GitLab + OpenFaaS for Serverless CI/CD on Kubernetes"](https://www.youtube.com/watch?v=WYyonInGNsw). Check their free versus stand plan features from [this doc](https://console.bluemix.net/docs/containers/cs_why.html#cluster_types).

```sh
# Download and install a few CLI tools and the IBM Kubernetes Service plug-in.

curl -sL https://ibm.biz/idt-installer | bash
ibmcloud login -a https://api.eu-de.bluemix.net
ibmcloud cs region-set eu-central
ibmcloud cs cluster-config gunship

export KUBECONFIG=/Users/$USER/.bluemix/plugins/container-service/clusters/gunship/kube-config-mil01-gunship.yml

kubectl get nodes
```

let's deploy openfaas.

```sh
git clone https://github.com/openfaas/faas-netes
# create name space

kubectl apply -f https://raw.githubusercontent.com/openfaas/faas-netes/master/namespaces.yml

cd faas-netes && \kubectl apply -f ./yaml
# memory usage is 327MB
```

check your cluster's public ip. visit kubernetes dashboard and find the openfaas namespace. in `Discovery and load balancing > Services > gateway`, you will be able to see port that is exposed.

running 2x4(2 CPUs, 4 GB RAM, 100 GB HDD) cluster costs $77.76 for 744 hours(31 days). it's worth waiting for digital ocean's kubernetes solution at this point.

```sh
brew install kubernetes-helm
helm init --canary-image --upgrade
```

---

## Useful tools

### krex

Kubernetes Resource Explorer

<https://github.com/kris-nova/krex>

krex in action - tail logs  
<!-- image unavailable: krex-in-action1 (https://files.jaigouk.com/2018/08/krex-in-action1.gif) -->

krex in action - describe & tail logs  
<!-- image unavailable: krex-in-action2 (https://files.jaigouk.com/2018/08/krex-in-action2.gif) -->

krex in action - sh into pod  
<!-- image unavailable: krex-in-action3 (https://files.jaigouk.com/2018/08/krex-in-action3.gif) -->

```sh
# installing
brew install ncurses
export PKG_CONFIG_PATH=/usr/local/opt/ncurses/lib/pkgconfig

ln -s /usr/local/opt/ncurses/lib/pkgconfig/formw.pc /usr/local/opt/ncurses/lib/pkgconfig/form.pc
ln -s /usr/local/opt/ncurses/lib/pkgconfig/menuw.pc /usr/local/opt/ncurses/lib/pkgconfig/menu.pc
ln -s /usr/local/opt/ncurses/lib/pkgconfig/panelw.pc /usr/local/opt/ncurses/lib/pkgconfig/panel.pc

go get -u github.com/kris-nova/krex
cd $GOPATH/src/github.com/kris-nova/krex
make all
```

### kubectx

Fast way to switch between clusters and namespaces in kubectl

<https://github.com/ahmetb/kubectx>

kubectx in action

![kubectx](https://github.com/ahmetb/kubectx/raw/master/img/kubectx-demo.gif)

kubens in action

![kubectx](https://github.com/ahmetb/kubectx/raw/master/img/kubens-demo.gif)

```sh
# installing
brew install kubectx
```
