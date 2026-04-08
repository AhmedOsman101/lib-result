import { createServer, type IncomingMessage, type Server } from "node:http";
import { Err, Ok, type Result } from "../dist/index.js";

export class DivisionError extends Error {
  constructor(message = "Cannot Divide By Zero") {
    super(message);
  }
}

export function divide(a: number, b: number): Result<number, DivisionError> {
  if (b === 0) {
    return Err(new DivisionError());
  }
  return Ok(a / b);
}

export function mayDivide(a: number, b: number): number {
  if (b === 0) throw new Error("Division by zero");
  return a / b;
}

export function toPromise<T>(fn: () => T | Promise<T>): Promise<T> {
  try {
    return Promise.resolve(fn());
  } catch (err) {
    return Promise.reject(err);
  }
}

export const double = (x: number) => x * 2;

export async function withHttpServer<T>(
  handler: (request: IncomingMessage) => {
    statusCode?: number;
    body?: unknown;
    headers?: Record<string, string>;
  },
  run: (baseUrl: string) => Promise<T>
): Promise<T> {
  const server = createServer((request, response) => {
    const { statusCode = 200, body, headers = {} } = handler(request);
    response.writeHead(statusCode, {
      "content-type": "application/json",
      ...headers,
    });
    response.end(body === undefined ? undefined : JSON.stringify(body));
  });

  await listen(server);

  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Failed to determine HTTP server address");
  }

  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    return await run(baseUrl);
  } finally {
    await close(server);
  }
}

function listen(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });
}

function close(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close(error => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}
