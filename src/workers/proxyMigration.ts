import { SandboxedJob, Worker } from "bullmq";
import * as iconik from "iconik-typescript";
import fetch from "node-fetch";

import RateLimitMiddleware from "../middleware/RateLimitMiddleware";
import environment from "../environment";

const filesApi = new iconik.FilesApi(
  iconik.createConfiguration({
    authMethods: {
      appId: environment.iconik.appId,
      authToken: environment.iconik.token
    },
    promiseMiddleware: [new RateLimitMiddleware()]
  })
);

export default async (job: SandboxedJob) => {
  try {
    if (job.name !== "migrateProxy") return;

    const asset = job.data as iconik.SearchDocumentSchema;

    job.log("Asset to Migrate: " + JSON.stringify(asset));

    if (!asset.id) throw new Error("No asset ID found with job");

    job.log(`Fetching proxies associated with asset ${asset.id}`);

    const proxies = (await filesApi.filesV1AssetsAssetIdProxiesGet(asset.id))
      .objects;

    job.log("Found Proxies: " + JSON.stringify(proxies));
    job.updateProgress(10);

    if (!proxies || proxies.length === 0)
      throw new Error("No proxies found for the given asset");

    let proxy = proxies[0];

    const proxyAny = proxy as any;

    for (const key of Object.keys(proxy)) {
      proxyAny[key] = proxyAny[key] === null ? undefined : proxyAny[key];
    }

    proxy = proxyAny as iconik.Proxy;

    if (!proxy.id) throw new Error("No id given for the found proxy");
    if (!proxy.url) throw new Error("No url given for the found proxy");

    job.log("Fetching proxy content length...");

    const contentLength = (
      await fetch(proxy.url, {
        method: "HEAD"
      })
    ).headers.get("content-length");

    if (!contentLength)
      throw new Error("Unable to get the content length of the proxy");

    job.log("Proxy content length found!");
    job.updateProgress(20);

    if (environment.dryRun) {
      job.log("DRY RUN MODE ENABLED! Skipping upload...");
      job.updateProgress(100);

      return {};
    }

    job.log(
      `Creating a new proxy in the new storage location (${environment.iconik.newStorageId})`
    );

    const newProxy = await filesApi.filesV1AssetsAssetIdProxiesPost(asset.id, {
      assetId: asset.id,
      audioBitrate: proxy.audioBitrate,
      bitRate: proxy.bitRate,
      codec: proxy.codec,
      filename: proxy.filename,
      format: proxy.format,
      frameRate: proxy.frameRate,
      isDropFrame: proxy.isDropFrame,
      name: proxy.name,
      resolution: proxy.resolution,
      rotation: proxy.rotation,
      size: proxy.size,
      startTimeCode: proxy.startTimeCode,
      versionId: proxy.versionId,
      storageId: environment.iconik.newStorageId
    });

    job.log("New Proxy: " + JSON.stringify(newProxy));
    job.updateProgress(30);

    if (!newProxy.id) throw new Error("No id given for the new proxy");
    if (!newProxy.uploadUrl)
      throw new Error("No upload url given when creating the new proxy");

    job.log(`Creating download stream using ${proxy.url}`);

    const downloadStream = await fetch(proxy.url);

    job.updateProgress(40);

    job.log(`Starting upload to ${newProxy.uploadUrl}`);

    const upload = await fetch(newProxy.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Length": contentLength,
        "x-ms-blob-type": "BlockBlob"
      },
      body: downloadStream.body
    });

    job.log("Upload finished!");

    job.log("Upload Body: " + JSON.stringify(upload.body));
    job.updateProgress(80);

    job.log("Updating status of the new proxy");

    const newStatus = await filesApi.filesV1AssetsAssetIdProxiesProxyIdPatch(
      asset.id,
      newProxy.id,
      {
        status: iconik.ProxySchemaStatusEnum.Closed,
        storageId: environment.iconik.newStorageId
      }
    );

    job.log("New Status: " + JSON.stringify(newStatus));
    job.updateProgress(90);

    job.log(`Deleting the old proxy ${proxy.id}`);

    await filesApi.filesV1AssetsAssetIdProxiesProxyIdDelete(asset.id, proxy.id);

    job.log("Old proxy deleted!");

    job.updateProgress(100);

    return newProxy;
  } catch (err: any) {
    if (err?.code === 429) {
      throw Worker.RateLimitError();
    }

    throw err;
  }
};
