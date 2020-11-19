const { PDFNet } = require('@pdftron/pdfnet-node');
const { exit } = require('process');
const xmlToJson = require('fast-xml-parser');
const JsonToXmlParser = require('fast-xml-parser').j2xParser;
const assert = require('assert');

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
    /**
     * Prepare the appropriate Filter objects to write the new XMP back into the
     * document
     */
    const filter = await PDFNet.Filter.createFromMemory(
      Buffer.from(
        newXmp,
        // latin1 encoding is used to ensure special characters are not mangled
        'latin1',
      ),
    );
    const newFilterReader = await PDFNet.FilterReader.create(filter);
    const newXmpStream = await pdfdoc.createIndirectStreamFromFilter(
      newFilterReader
    );
    await (await pdfdoc.getRoot()).put("Metadata", newXmpStream);
    // Set the new title and subject of the document
    const pdfDocInfo = await pdfdoc.getDocInfo();
    pdfDocInfo.setTitle(newTitle);
    pdfDocInfo.setSubject(newSubject);
    // Save the document to memory, and convert to PDF/A
    let uint8Array = await pdfdoc.saveMemoryBuffer(PDFNet.SDFDoc.SaveOptions.e_linearized);
    const pdfaCompliance = await PDFNet.PDFACompliance.createFromBuffer(
      true,
      uint8Array,
      '',
      PDFNet.PDFACompliance.Conformance.e_Level1B,
    );
    uint8Array = await pdfaCompliance.saveAsFromBuffer(true);
    const pdfa = await PDFNet.PDFDoc.createFromBuffer(uint8Array);
    // Assert that the XMP replacement changes the PDF/A title and subject
    assert.deepStrictEqual((await (await pdfa.getDocInfo()).getTitle()), newTitle);
    assert.deepStrictEqual((await (await pdfa.getDocInfo()).getSubject()), newSubject);
    await pdfaCompliance.saveAsFromFileName('modified-pdfa.pdf', true);
  } catch (e) {
    console.error(`Error: ${e}`);
  } finally {
    PDFNet.shutdown();
  }
  console.log('Gracefully exitting.');
})();
