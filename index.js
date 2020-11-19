const { PDFNet } = require('@pdftron/pdfnet-node');
const { exit } = require('process');

(async () => {
  try {
    await PDFNet.initialize();
    console.log('PDFNet initialized');
    const pdfdoc = await PDFNet.PDFDoc.createFromFilePath(
      'PDF_with_title_and_subject.pdf'
    );
    const xmpStream = await (await pdfdoc.getRoot()).findObj("Metadata");
    if (!xmpStream) {
      console.warn('No XMP stream detected in the PDF, exitting.');
      exit(0);
    }
  } catch (e) {
    console.error(`Error: ${e}`);
  } finally {
    PDFNet.shutdown();
  }
  console.log('Gracefully exitting.');
})();
