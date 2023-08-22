const { default: LocalClusterService } = require('@kapeta/local-cluster-service');

(async () => {
    const result = await LocalClusterService.start();
    process.send(result);
})().catch((err) => {
    process.stderr.end(err.stack);
    process.exitCode = 1;
});
