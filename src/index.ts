import Proxy from "./Proxy";

declare module "bun" {
  interface Env {
    PROXY_LIST: string;
  }
}

const proxy = new Proxy();

await proxy.get();
