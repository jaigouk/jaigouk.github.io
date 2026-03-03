---
title: "harbor on k3s"
description: "Deploying harbor arm64 registry to raspberry pi k3s cluster"
date: 2021-04-03
tags:
  - tools
author: Jaigouk Kim
draft: false
---

update(2022): I don't use harbor anymore with my local k3s cluster. instead, I am just using registry ui with private registry.

It took some time to find a simple and easy way to deploy registry with UI to my rpi k3s cluster. The official repo does not provide arm64 images and it requires high memory. I found a way to deploy harbor on my rpi 4 cluster.

```sh
git clone https://github.com/querycap/harbor.git
cd harbor
make dep
cd components/harbor
```

## edit cue files

app.cue file

```json
package harbor

import (
	harbor "github.com/goharbor/harbor-helm:chart"
)

{
	apiVersion: "octohelm.tech/v1alpha"
	kind:       "Release"
	metadata: namespace: "harbor-system"
	metadata: labels: context: "default"
	#name:      "harbor"
	#namespace: "harbor-system"
	#context:   *"hw-sg" | string
```

values.cue file

change the tag based on [querycap`s harbor/harbor-portal](https://github.com/orgs/querycap/packages/container/package/harbor%2Fharbor-portal)

```json
package harbor

#values: {
	host:          *"harbor.example.io" | string
	adminPassword: *"xxxxxx" | string

	image: repo: "ghcr.io/querycap/harbor"
	image: tag:  "ec0ba11"
}
```

install [cue](https://cuelang.org/docs/integrations/json/) and deploy

```sh
go install cuelang.org/go/cmd/cue@latest

cuem k show commponents/harber > result.yaml

# edit result.yaml

kubectl apply -f result.yaml
```

<!-- image unavailable: harbor-on-kubenetes (https://files.jaigouk.com/2021/04/harbor-on-kubenetes.png) -->

## dex OIDC

To make harbor more secure, I installed [dex](https://github.com/dexidp/dex)

here are the links for installing it

- <https://dexidp.io/docs/kubernetes/>
- <https://github.com/dexidp/dex/blob/master/examples/k8s/dex.yaml>
- <https://goharbor.io/docs/1.10/administration/configure-authentication/oidc-auth/>
