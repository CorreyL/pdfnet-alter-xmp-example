const { PDFNet } = require('@pdftron/pdfnet-node');

(async () => {
  try {
    await PDFNet.initialize();
    console.log('PDFNet initialized');
  } catch (e) {
    console.error(`Error: ${e}`);
  } finally {
    PDFNet.shutdown();
  }
  console.log('Gracefully exitting.');
})();
