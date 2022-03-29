import fs from 'fs'
import path from 'path'
import xml2json from "xml2json";
import { generateComplexType, generateSimpleType } from '.';

import { XSD } from './types';


async function run() {
  // const file = await fs.promises.readFile(path.join(__dirname, './test-files/odf2-values.xsd'), 'utf8');
  const file = await fs.promises.readFile(path.join(__dirname, './test-files/odf2-structure.xsd'), 'utf8');
  // const file = await fs.promises.readFile(path.join(__dirname, './test-files/odf2-structure.xsd'), 'utf8');
  const json: XSD = xml2json.toJson(file, {
    object: true,
    arrayNotation: true,
    alternateTextNode: "text",
  }) as XSD;

  const [schema] = json['xs:schema'];

  if (schema['xs:simpleType']) {
    // console.log(JSON.stringify(schema['xs:simpleType'][0], null, 2))
    schema['xs:simpleType'].map(generateSimpleType)
  }

  if (schema['xs:complexType']) {
    console.log(JSON.stringify(schema['xs:complexType'][29], null, 2))
    generateComplexType(schema['xs:complexType'][29])
  }
  // console.log(json);

}

run()
