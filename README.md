# Using PDFNet to Alter the XMP Metadata of a PDF

This repository demonstrates how to leverage [@pdftron/pdfnet-node](
  https://www.npmjs.com/package/@pdftron/pdfnet-node
) to alter the XMP Metadata of a PDF, ensuring that when properties of a
document are changed, such as `Title` and `Subject`, they are reflected in the
resulting PDF/A file that is outputted.

## Requirements

This repository has been written in [`Node 12.18.3`](
  https://nodejs.org/dist/latest-v12.x/
), but other versions of NodeJS may work.

```sh
git clone git@github.com:CorreyL/pdfnet-alter-xmp-example.git
cd pdfnet-alter-xmp-example
npm install
npm start
```

Note that this repository assumes you have a PDF with XMP metadata in the
working directory, with the file name `PDF_with_title_and_subject.pdf`
