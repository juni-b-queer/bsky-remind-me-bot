# RemindMe! Bot

Reply to any skeet with "RemindMe! # years, # months, # weeks, # days, # hours, # minutes" and the bot will remind you after that time has passed by replying to you!

### Everything below this in the README is out of date, it's originally the readme for the bun firehose reply bot I made, that can also be found in my github.



## Quickstart
This was built to use the [Bun](https://bun.sh) runtime instead of NodeJs! Make sure you have Bun installed!

To install dependencies:

```bash
bun install
```

Copy and fill in the .env file
```bash
cp .env.example .env
```

To run:

```bash
bun run ./src/index.ts
```

## Docker
Docker commands
Bun uses a .env file, so make sure to run the .env command, and fill in the values
```bash
docker build --pull -t firehose-bot .
```

Run it with 
```bash
docker run -d --restart unless-stopped firehose-bot
```


## Creating your own handlers!
Handlers are super easy to setup, and often contained in a single file.

For handling posts and replies, you'll want to create a `PostHandler`. These have 2 required, and 1 optional parameter

```typescript
let ExampleHandler = new PostHandler(
    [new InputStartsWithValidator('Hello')], //triggerValidations
    handlerFunction, // triggerAction
    true //requireFollowing
)
```

### triggerValidations
Array of Validator objects that extend `AbstractValidator`

Existing validators:

```typescript
new InputStartsWithValidator('foo') // will return true when the post starts with "foo"
new InputContainsValidator('bar') // will return true when the post contains "bar"
new InputEqualsValidator('Hello, World!') // will return true when post equals "Hello, World!"

// The function validator takes in a function with an input parameter and returns a boolean 
// the given function is used when the validator's shouldTrigger function is called
new SimpleFunctionValidator((input) => {
    return input.length > 100;
})
```

By default, all validators are required to return true in order for the action to be triggered.
If you want to trigger the action if one or more of the validators returns, use the `OrValidator`

```typescript
// This validator will return true if the post starts with 'foo' OR contains 'bar'
new OrValidator([
    new InputStartsWithValidator('foo'), 
    new InputContainsValidator('bar')
])
```

### triggerAction
The trigger action function is what should happen if the validators return true, and the action is triggered.

This function can be anything, but is required to accept parameters; `agent: BskyAgent, op: RepoOp, postDetails: PostDetails`. It's easiest to include the trigger function in whatever file you create your handler (see `./src/handlers/test-handler/test-handler.ts`)

For most actions, you'll likely be replying to the given post that triggered the action, because of this, there is an easy to use `replyToPost` utility function.
```typescript
function handlerFunction(agent: BskyAgent, op: RepoOp, postDetails: PostDetails){
    let response = "This is the text that will be in the reply"
    replyToPost(agent, postDetails, response)
}
```

The function doesn't need to reply to a post, you could make an action that does anything, and integrates with other services or applications.


### requireFollowing
This is an optional Boolean parameter that defaults to true. 
When it's set to true, it will only run the action if the poster is following the account that the bluesky agent is logged in to.
This was added to ensure the bot doesn't flood the skyline, and is OPT-IN by default.
Setting it to false is only recommended when creating a bot command, for example: `!showmethebee`,
because the use of the given command is the user opting in to being replied to by the bot in this instance

## Putting it all together
Given all of those parameters, we can make a new handler very easily:

```typescript
import {PostHandler} from "./abstract-handler";
import {InputContainsValidator} from "./string-validators";

export let NewFooBarHandler = new PostHandler(
    [new InputContainsValidator('foo'), new InputContainsValidator('bar')],
    fooBarAction,
    true
)

function fooBarAction(agent: BskyAgent, op: RepoOp, postDetails: PostDetails){
    replyToPost(agent, postDetails, "Foo and Bar detected!")
}
```
This example handler will only trigger when both "foo" and "bar" are detected in the post, and then it will respond with "Foo and Bar detected!"

### Handler Controllers
Handler Controllers are basically a collection of Handlers that are
validated and run together. The first parameter is the bluesky agent,
so that you can have different agents/accounts handle different actions.
And then an Array of PostHandlers, which are all handled together.

```typescript
let exampleHandlerControlelr = new HandlerController( agent, [
    NewFooBarHandler,
    ExampleHandler
])
```

To run the handlers, we call `exampleHandlerController.handler(op, repo)`, which is done when the firehose gets a new repo operation


## Using your new handler
Now that the new handler is created, we need to make it active.
This is all done in the `initialize()` function in `src/index`

After the agent is logged in, we create our Handler Controllers.
There are three handler controllers already created and set up to use, you just need to add your handler to it!

```typescript
import {PostHandler} from "./abstract-handler";
import {InputEqualsValidator} from "./string-validators";

postOnlyHandlerController = new HandlerController(agent, [
    FooBarHandler
])

replyOnlyHandlerController = new HandlerController(agent, [
    ExampleReplyHandler
])

allPostsHandlerController = new HandlerController(agent, [
    // This is an example of inline creating a PostHandler, instead of creating it in a new file.
    new PostHandler(
        [new InputEqualsValidator('Hello World')],
        (agent, op, postDetails) => {
            console.log('Found post with hello world')
        },
        false
    )
])
```

These are run in the firehose message handler according to their name (`src/index`)
```typescript
switch (payload?.$type) {
    case 'app.bsky.feed.post':
        if (AppBskyFeedPost.isRecord(payload)) {
            let repo = m.repo;
            if (payload.reply) {
                replyOnlyHandlerController.handle(op, repo)
            }else{
                postOnlyHandlerController.handle(op, repo)
            }
            allPostsHandlerController.handle(op, repo)
        }
}
```
When a repo operation is a post, and it's a reply, we run the replyOnly Handlers.
When a repo operation is a post, and not a reply, we run the postOnly Handlers.
And then for every repo operation that is a post, we run the allPosts Handlers.


If you want your Handler to only run on replies, add it to the replyOnlyHandlerController.
Only on root posts, add it to the postsOnlyHandlerController.
Or for any post, add it to the allPostsHandlerController

## Contribute
Uh? sure? Feel free to open a PR if you have any thoughts or ideas for how this could be improved. I'm planning on 
updating some of the functions and handlers to make it more readable and optimized. I don't like how I'm flattening/normalizing
text right now so that'll be a future change when I get to it.

But anyway, feel free to open issues or PRs! Thanks!

## Credits/License stuff
This project was created using `bun init` in bun v1.0.2. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

Other than that idk, just be responsible, be smart, don't spam, and give me credit where it's due.
