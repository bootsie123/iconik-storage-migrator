import axios, { AxiosInstance } from "axios";
import winston from "winston";
import * as AxiosLogger from "axios-logger";

import logger from "../logger";
import environment from "../environment";

export interface APIServiceOptions {
  logger?: winston.Logger;
}

export class APIService {
  private logger: winston.Logger;

  private http!: AxiosInstance;

  constructor(options: APIServiceOptions = {}) {
    this.logger = options.logger ? options.logger : this.createLogger();

    this.initAxiosInstance();
  }

  private createLogger(): winston.Logger {
    return logger.child({ label: "APIService" });
  }

  private initAxiosInstance() {
    const http = axios.create({
      baseURL: "https://app.iconik.io/API/"
    });

    http.defaults.headers.common = {
      "App-ID": environment.iconik.appId,
      "Auth-Token": environment.iconik.token
    };

    http.interceptors.request.use(
      AxiosLogger.requestLogger,
      AxiosLogger.errorLogger
    );
    http.interceptors.response.use(
      AxiosLogger.responseLogger,
      AxiosLogger.errorLogger
    );

    this.http = http;
  }

  //_exists_:proxies.status AND NOT proxies.storage_id:"416c8818-2ff0-11ef-a5d5-c6baf4e85186"
  async search(): Promise<void> {
    await this.http.get("search/v1/search", {
      headers: {
        generate_signed_url: false,
        generate_signed_download_url: false,
        save_search_history: false
      },
      data: {}
    });
  }
}
