const LocalClusterService = require('@blockware/local-cluster-service');

(async () => {
  const result = await LocalClusterService.start()
  process.send(result);
})()
