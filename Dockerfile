FROM denoland/deno:2.0

WORKDIR /app

COPY deno.json deno.lock ./

RUN deno cache main.ts

COPY . .

EXPOSE 3000

CMD ["deno", "run", "--allow-all", "main.ts"]
