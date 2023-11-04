# bun-firehose-bot

To install dependencies:

```bash
bun install
```

Copy and fill in the .env example
```bash
cp .env.example .env
```

To run:

```bash
bun run ./src/index.ts
```




This project was created using `bun init` in bun v1.0.2. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

Docker commands
Bun uses a .env file, so make sure to run the .env command, and fill in the values
```bash
docker build --pull -t firehose-bot .
```

Run it with 
```bash
docker run -d firehose-bot
```