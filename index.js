const { PDFNet } = require('@pdftron/pdfnet-node');
const { promises: fs } = require('fs');
const { exit } = require('process');
const xmlToJson = require('fast-xml-parser');
const JsonToXmlParser = require('fast-xml-parser').j2xParser;

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
    const stream = await xmpStream.getDecodedStream();
    const filterReader = await PDFNet.FilterReader.create(stream);
    let char = await filterReader.get();
    let total = '';
    while (char > 0) {
      total += String.fromCharCode(char);
      char = await filterReader.get();
    }
    /**
     * The outermost xpacket elements are not being converted to the JSON format
     * hence they need to be manually extract via Regular Expressions
     */
    const re = /<\?xpacket .*\?>/gm;
    const matches = [];
    let match = re.exec(total);
    while (match != null) {
        matches.push(match[0]);
        match = re.exec(total);
    }
    const openingXPacket = matches[0];
    const closingXPacket = matches[1];
    const jsonObj = xmlToJson.parse(
      total,
      {
        // Ensures the attributes of each XML element are carried over
        ignoreAttributes: false,
      },
      true
    );
    const newTitle = 'Title: New Title';
    const newSubject = 'Subject: New Subject';
    jsonObj['x:xmpmeta']['rdf:RDF']['rdf:Description'][1]['dc:title']['rdf:Alt']['rdf:li']['#text'] = newTitle;
    jsonObj['x:xmpmeta']['rdf:RDF']['rdf:Description'][1]['dc:description']['rdf:Alt']['rdf:li']['#text'] = newSubject;
    jsonToXmlParser = new JsonToXmlParser({
      // Ensures the attributes of each XML element are carried over
      ignoreAttributes: false,
    });
    const xmlFromJson = jsonToXmlParser.parse(jsonObj);
    const newXmp = `${openingXPacket}${xmlFromJson}${closingXPacket}`;
    await fs.writeFile('changedXmp.xml', newXmp);
  } catch (e) {
    console.error(`Error: ${e}`);
  } finally {
    PDFNet.shutdown();
  }
  console.log('Gracefully exitting.');
})();
