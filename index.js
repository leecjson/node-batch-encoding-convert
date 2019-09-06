'use strict';

const pathModule = require('path');
const encoding = require('encoding');
const jschardet = require('jschardet');
const fs = require('fs-extra');
const stripBomBuffer = require('strip-bom-buf');

function selectFiles(rootDir, subfixs) {
  const targets = [];
  const walk = (dir) => fs.readdirSync(dir)
    .forEach(filename => {
      const path = pathModule.resolve(dir, filename);
      const stat = fs.statSync(path);
      if (stat.isDirectory()) {
        walk(path);
      } else if (stat.isFile()) {
        if (Array.isArray(subfixs)) {
          if (subfixs.some(e => path.endsWith(e))) {
            targets.push(path);
          }
        } else {
          targets.push(path);
        }
      }
    });
  walk(rootDir);
  return targets;
}

async function convertFiles(files, targetEncoding = 'utf-8', minConfidence = 0.8) {
  let unknowFiles = [];
  let completedFiles = [];
  let buf;
  for (const filepath of files) {
    buf = await fs.readFile(filepath);
    const det = jschardet.detect(buf); 
    if (det.confidence < minConfidence) {
      unknowFiles.push(filepath);
      continue;
    }
    buf = encoding.convert(buf, targetEncoding, det.encoding);
    if (targetEncoding.toLowerCase() == 'utf-8' || targetEncoding.toLowerCase() == 'utf8') {
      buf = stripBomBuffer(buf);
    }
    await fs.writeFile(filepath, buf, {
      encoding: targetEncoding,
    });
    completedFiles.push(filepath);
  }
  console.log(`${completedFiles.length} files has been converted, but ${unknowFiles.length} files are confidenceless`);
  unknowFiles.forEach(e => {
    console.error(e);
  });
}

convertFiles(
  selectFiles(pathModule.normalize('D:\\Unreal Projects\\FTVR\\Source'), ['.cpp', '.h'])
);