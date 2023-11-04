# bun-firehose-bot

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run ./src/index.ts
```

This project was created using `bun init` in bun v1.0.2. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

DOCKER IS NOT YET STABLE
Build the docker image with 
```bash
docker build --pull -t firehose-bot .
```

Run it with 
```bash
docker run -d firehose-bot --env-file .env
```