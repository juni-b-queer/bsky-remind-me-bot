# Bun Firehose Bot

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
To trigger the bot to respond to a Post, add a `payloadTriggerStartsWith` or `payloadTriggerContains` to the `postReplyHandler` function

If you want to trigger the action when a post starts with "Hello, World!", you'd add the following (don't include spaces)
```typescript
async function postHandler(op: RepoOp, repo: string){
    // When Post Starts with 
    payloadTriggerStartsWith(op, repo, 'hello,world!').then((postDetails: false | PostDetails) => {
        if (postDetails) {
            // Set the reply text and send the reply
            let inputText = `Junis secret key detected within post`;
            handlePostPayloadWithReply(op, postDetails, inputText)
        }
    })
}
```

The code is nearly the same if you want to only have something trigger on a reply
For example, to trigger when a reply contains "secret password", you'd add the following

```typescript
async function postReplyHandler(op: RepoOp, repo: string){
    // When payload contains secretpassword
    payloadTriggerContains(op, repo, 'secretpassword').then((postDetails: false | PostDetails) => {
        if (postDetails) {
            let inputText = `reply contains secret password`;
            handleReplyPayloadWithReply(op, postDetails, inputText)
        }
    })
    
}
```


Within both `postHandler` and `postReplyHandler` you can add multiple triggers and actions, so your bot can handle multiple triggers
```typescript
async function postHandler(op: RepoOp, repo: string){
    // When Post Starts with 
    payloadTriggerStartsWith(op, repo, 'hello,world!').then((postDetails: false | PostDetails) => {
        ...
    })

    // When post contains
    payloadTriggerContains(op, repo, 'secretpassword').then((postDetails: false | PostDetails) => {
        ...
    })
}
```

## Contribute
Uh? sure? Feel free to open a PR if you have any thoughts or ideas for how this could be improved. I'm planning on 
updating some of the functions and handlers to make it more readable and optimized. I don't like how I'm flattening/normalizing
text right now so that'll be a future change when I get to it.

But anyway, feel free to open issues or PRs! Thanks!

## Credits/License stuff
This project was created using `bun init` in bun v1.0.2. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

Other than that idk, just be responsible, be smart, don't spam, and give me credit where it's due.
