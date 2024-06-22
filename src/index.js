import axios from "axios";
import fetch from "node-fetch";

axios.defaults.baseURL = "https://app.iconik.io/API/";
axios.defaults.headers = {
  "App-ID": "80d3f1a0-2f30-11ef-9aa6-e6aa2d352bc6",
  "Auth-Token":
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjgyODMxYTk0LTJmMzAtMTFlZi1hMWU1LWU2YWEyZDM1MmJjNiIsImV4cCI6MjAzNDM2NzA4Nn0.CUGoEQJX-IeG0ttlZQH81Z3F8OEYg-fRst2ty2zBZDs"
};

const asset = "45ac1ef8-29a5-11ef-8a67-2e3c4b36d120";

(async () => {
  let res = await axios.get(`/files/v1/assets/${asset}/proxies`);

  const proxy = res.data.objects[0];

  console.log(proxy);

  res = await axios.post(`/files/v1/assets/${asset}/proxies`, {
    asset_id: proxy.asset_id,
    audio_bitrate: proxy.audio_bitrate === null ? undefined : proxy.audio_bitrate,
    bit_rate: proxy.bit_rate,
    codec: proxy.codec,
    filename: proxy.filename,
    format: proxy.format,
    frame_rate: proxy.frame_rate,
    is_drop_frame: proxy.is_drop_frame,
    name: proxy.name,
    resolution: proxy.resolution,
    rotation: proxy.rotation,
    size: proxy.size,
    start_time_code: proxy.start_time_code,
    storage_id: "6028d6de-29a7-11ef-a4a3-629bf89d66f8",
    version_id: proxy.version_id
  });

  const newProxy = res.data;

  console.log(newProxy);

  const contentLength = (await axios.head(proxy.url)).headers["content-length"];

  const downloadStream = await fetch(proxy.url);

  const uploadRes = await fetch(newProxy.upload_url, {
    method: "PUT",
    headers: {
      "Content-Length": contentLength,
      "x-ms-blob-type": "BlockBlob"
    },
    body: downloadStream.body
  });

  console.log(uploadRes);

  const updateStatus = await axios.patch(`/files/v1/assets/${asset}/proxies/${newProxy.id}`, {
    status: "CLOSED"
  });

  console.log(updateStatus.data);

  //const deleteOldProxy = await axios.delete(`/files/v1/assets/${asset}/proxies/${proxy.id}`);

  //console.log(deleteOldProxy.data);

  /*
  // Cleanup
  const proxies = (await axios.get(`/files/v1/assets/${asset}/proxies`)).data;

  for (const proxy of proxies.objects) {
    if (proxy.status === "AWAITED") {
      console.log(`DELETED: ${proxy.id}`);
      axios.delete(`/files/v1/assets/${asset}/proxies/${proxy.id}`);
    }
  }
  */
})();
