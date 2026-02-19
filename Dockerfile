FROM denoland/deno:2.0

WORKDIR /app

COPY deno.json deno.lock ./

RUN deno cache main.ts

COPY . .

EXPOSE 3000

CMD ["deno", "run", "--allow-all", "main.ts"]

ENV OTEL_DENO=true
ENV OTEL_SERVICE_NAME=yetibot
ENV OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
