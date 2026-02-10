// eslint-disable-next-line @typescript-eslint/triple-slash-reference
// @ts-nocheck
/// <reference path="types.d.ts" />

cronAdd('match-logs-cleanup-daily', '0 10 * * *', () => {
  const logger = $app.logger().with('hook', 'data-retention-cleanup');
  const RETENTION_DAYS = 14;
  const BATCH_SIZE = 200;
  const formatDateTime = (date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    const hour = `${date.getHours()}`.padStart(2, '0');
    const minute = `${date.getMinutes()}`.padStart(2, '0');
    const second = `${date.getSeconds()}`.padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  };
  const buildCutoffDateTime = () => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);
    return formatDateTime(cutoff);
  };

  const cutoffDateTime = buildCutoffDateTime();
  const deleteRecordsBeforeCutoff = (collectionName) => {
    let deletedCount = 0;

    while (true) {
      const targets = $app.findRecordsByFilter(
        collectionName,
        'created <= {:cutoff}',
        'created',
        BATCH_SIZE,
        0,
        { cutoff: cutoffDateTime },
      );

      if (!targets?.length) {
        break;
      }

      targets.forEach((record) => {
        if (!record) {
          return;
        }
        $app.delete(record);
        deletedCount += 1;
      });
    }

    return deletedCount;
  };

  const deletedMatchLogsCount = deleteRecordsBeforeCutoff('match_logs');
  const deletedExtractedAssetsCount = deleteRecordsBeforeCutoff('extracted_assets');

  logger.info(
    'cleanup completed',
    'job',
    'match-logs-cleanup-daily',
    'deletedMatchLogsCount',
    deletedMatchLogsCount,
    'deletedExtractedAssetsCount',
    deletedExtractedAssetsCount,
    'cutoffDateTime',
    cutoffDateTime,
  );
});
