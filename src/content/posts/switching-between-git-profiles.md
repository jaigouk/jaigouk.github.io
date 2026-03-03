---
title: "Switching between git profiles"
description: "> Thinking of yourself as a separate entity can reduce anxiety, while also kicking"
date: 2019-03-02
author: Jaigouk Kim
draft: false
---

> Thinking of yourself as a separate entity can reduce anxiety, while also kicking up some major benefits for your confidence and determination. - David Robson, BBC.com

This article([The 'Batman Effect': How having an alter ego empowers you](https://lsa.umich.edu/psych/news-events/all-news/faculty-news/the--batman-effect---how-having-an-alter-ego-empowers-you.html)) was featured on HN best. It would be more productive for you to have a separate machine and git profile to be more focused on side projects.  But maintaining multiple profiles can be painful. Sometimes, it's easy to switch and commit your codes and push. So, I have my own setup to prevent a situation like that.

You can automate switching users based on directory.

For zsh,

```sh
precmd_functions=(switch_git_user)
switch_git_user() {
  if [[ $PWD == "$HOME/user/git_repo" ]]; then
    $HOME/bin/switch hack

    cat ~/.gitconfig
  fi
}
```

with the switch script and precmd above, I can just switch git profile automatically.
