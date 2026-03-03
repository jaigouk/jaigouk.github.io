---
title: "OpenAI Codex - the future"
description: "Programmer's point of view on OpenAI Codex. thinking about 5 years from now."
date: 2022-07-19
tags:
  - ideas
author: Jaigouk Kim
draft: false
---

When I saw  ["Using GPT-3 to explain how code works"](https://simonwillison.net/2022/Jul/9/gpt-3-explain-code/) on HN, I was skeptical. Recently, I was able to access OpenAI. So I played with OpenAI'S gpt-3 Codex. It is still in private beta status. But I was surprised by the result. It was quite useful.

## Experiment

["Go with Test" Gitbook](https://quii.gitbook.io/learn-go-with-tests/questions-and-answers/http-handlers-revisited) author wrote following steps for code snippets that he will refactor.

1.Write HTTP responses, send headers, status codes, etc.  
2.Decode the request's body into a User  
3.Connect to a database (and all the details around that)  
4.Query the database and applying some business logic depending on the result  
5.Generate a password  
6.Insert a record

And here is the result from Codex

1.check if there is **proper** json body or error  
2.check if username **already exists** in users datastore, if so, 400  
3.else insert user right away  
4.return 200

The golang code I used:

```
// Registration function
func Registration(w http.ResponseWriter, r *http.Request) {
    var res model.ResponseResult
    var user model.User

    w.Header().Set("Content-Type", "application/json")

    jsonDecoder := json.NewDecoder(r.Body)
    jsonDecoder.DisallowUnknownFields()
    defer r.Body.Close()

    // check if there is proper json body or error
    if err := jsonDecoder.Decode(&user); err != nil {
        res.Error = err.Error()
        // return 400 status codes
        w.WriteHeader(http.StatusBadRequest)
        json.NewEncoder(w).Encode(res)
        return
    }

    // Connect to mongodb
    client, _ := mongo.NewClient(options.Client().ApplyURI("mongodb://127.0.0.1:27017"))
    ctx, _ := context.WithTimeout(context.Background(), 10*time.Second)
    err := client.Connect(ctx)
    if err != nil {
        panic(err)
    }
    defer client.Disconnect(ctx)
    // Check if username already exists in users datastore, if so, 400
    // else insert user right away
    collection := client.Database("test").Collection("users")
    filter := bson.D{{"username", user.Username}}
    var foundUser model.User
    err = collection.FindOne(context.TODO(), filter).Decode(&foundUser)
    if foundUser.Username == user.Username {
        res.Error = UserExists
        // return 400 status codes
        w.WriteHeader(http.StatusBadRequest)
        json.NewEncoder(w).Encode(res)
        return
    }

    pass, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
    if err != nil {
        res.Error = err.Error()
        // return 400 status codes
        w.WriteHeader(http.StatusBadRequest)
        json.NewEncoder(w).Encode(res)
        return
    }
    user.Password = string(pass)

    insertResult, err := collection.InsertOne(context.TODO(), user)
    if err != nil {
        res.Error = err.Error()
        // return 400 status codes
        w.WriteHeader(http.StatusBadRequest)
        json.NewEncoder(w).Encode(res)
        return
    }

    // return 200
    w.WriteHeader(http.StatusOK)
    res.Result = fmt.Sprintf("%s: %s", UserCreated, insertResult.InsertedID)
    json.NewEncoder(w).Encode(res)
    return
}
```

And then, I tried the refactored code

```
package main

import (
    "encoding/json"
    "fmt"
    "log"
    "net/http"
)

// User represents a person in our system.
type User struct {
    Name string
}

// UserService provides ways of working with users.
type UserService interface {
    Register(user User) (insertedID string, err error)
}

// UserServer provides an HTTP API for working with users.
type UserServer struct {
    service UserService
}

// NewUserServer creates a UserServer.
func NewUserServer(service UserService) *UserServer {
    return &UserServer{service: service}
}

// RegisterUser is a http handler for storing users.
func (u *UserServer) RegisterUser(w http.ResponseWriter, r *http.Request) {
    defer r.Body.Close()

    var newUser User
    err := json.NewDecoder(r.Body).Decode(&newUser)

    if err != nil {
        http.Error(w, fmt.Sprintf("could not decode user payload: %v", err), http.StatusBadRequest)
        return
    }

    insertedID, err := u.service.Register(newUser)

    if err != nil {
        //todo: handle different kinds of errors differently
        http.Error(w, fmt.Sprintf("problem registering new user: %v", err), http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusCreated)
    fmt.Fprint(w, insertedID)
}

// MongoUserService provides storage functionality for Users.
type MongoUserService struct {
}

// NewMongoUserService creates a new MongoUserService managing connection pools etc probably!.
func NewMongoUserService() *MongoUserService {
    //todo: pass in DB URL as argument to this function
    //todo: connect to db, create a connection pool
    return &MongoUserService{}
}

// Register will store a user in mongo.
func (m MongoUserService) Register(user User) (insertedID string, err error) {
    // use m.mongoConnection to perform queries
    panic("implement me")
}

// main function
func main() {
    mongoService := NewMongoUserService()
    server := NewUserServer(mongoService)
    log.Fatal(http.ListenAndServe(":8000", http.HandlerFunc(server.RegisterUser)))
}

// describe main function and NewUserServer function and RegisterUser 
// 1.
```

1. main function creates a mongo service and a user server  
2. main function starts a http server and registers the RegisterUser handler  
3. RegisterUser handler is called when a request is made to the server  
4. RegisterUser handler calls the UserService to store the user

Of course it is not perfect. You need to express your intensions well enough. But can you imagine the future where Codex is used everywhere? This is more than using Copilot. "Ruby on Rails" became famous in 2000s. Because it was easy to express your thoughts in code and build prototype fast. So lots of startups launched their products quickly and iterated them based on customer insights. From my point of view, Copilot and Codex are helping me to build a product. Soon, it would become like having a senior developer with me.

## Concerns

Is it encrypted? People think Copilot is evil because open source contributors never agreed on this.

> [Give Up GitHub: The Time Has Come!](https://sfconservancy.org/blog/2022/jun/30/give-up-github-launch/)
> Those who forget history often inadvertently repeat it. Some of us recall that twenty-one years ago, the most popular code hosting site, a fully Free and Open Source (FOSS) site called SourceForge, proprietarized all their code — never to make it FOSS again. Major FOSS projects slowly left Source…

On HN this was posted [GPT-3 reveals my full name – can I do anything?](https://news.ycombinator.com/item?id=31883373)

> What's the current status of Personally Identifying Information and language models?

> I try to hide my real name whenever possible, out of an abundance of caution. You can still find it if you search carefully, but in today's hostile internet I see this kind of soft pseudonymity as my digital personal space, and expect to have it respected.

> When playing around in GPT-3 I tried making sentences with my username.

end to end encryption is a must. but more than that, we don't know that Codex won't share my data with authorities. It sounds absurd. BUT check out this article.

[New documents reveal scale of US Government’s cell phone location data tracking](https://www.aclu.org/news/privacy-technology/new-records-detail-dhs-purchase-and-use-of-vast-quantities-of-cell-phone-location-data)

It will take time to have a codex as a commodity. Even for open source version of similar project requires 200GB of GPU ram. That is about 10 RTX 3090 cards. That is heavy budget for solo founders or for small sized companies. And gathering the dataset is also a problem. I guess big companies like OpenAI or Microsoft would not let it go. They will hold it and build high walls to dominate the market.

## The Future

Designing would be something that AI can't do better than human(not generating mockups like following examples)

> [DALL·E 2](https://openai.com/dall-e-2/)
> DALL·E 2 is a new AI system that can create realistic images and art from a description in natural language.

> [NVIDIA Canvas : Harness The Power Of AI](https://www.nvidia.com/en-us/studio/canvas/)
> Create Backgrounds Quickly, or Speed up your Concept Exploration.

Designing services and digging into customers' pains would be the same. [There are things that don't scale.](http://paulgraham.com/ds.html)
