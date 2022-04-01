import fs from 'fs'
import path from 'path'
import xml2json from "xml2json";
import { generateComplexType, generateSimpleType } from '.';

import { XSD, Schema } from './types';


function convertToTypes(schema: Schema) {
  if (schema['xs:simpleType']) {
    schema['xs:simpleType'].map(generateSimpleType)
  }

  if (schema['xs:complexType']) {
    schema['xs:complexType'].map(generateComplexType)
  }
}

async function readSchema(filePath: string) {
  const file = await fs.promises.readFile(path.join(__dirname, filePath), 'utf8');
  const json: XSD = xml2json.toJson(file, {
    object: true,
    arrayNotation: true,
    alternateTextNode: "text",
  }) as XSD;
  return json
}

async function convert(filePath: string) {
  const jsonSchema = await readSchema(filePath)
  const [schema] = jsonSchema['xs:schema'];

  // supported top-level keys
  const knownKeys = new Set(['xmlns:xs', 'elementFormDefault', 'attributeFormDefault', 'xs:include', 'xs:complexType', 'xs:simpleType'])

  const unsupportedKeys = Object.keys(schema).filter(key => !knownKeys.has(key))
  if (unsupportedKeys.length) {
    throw new Error(`Unsupported top-level key: ${JSON.stringify(unsupportedKeys)}`);
  }

  // recursively call convert on included files
  if (schema['xs:include']) {
    const [{schemaLocation}] = schema['xs:include'];
    // include is relative to passed file
    const includePath = path.join(filePath, '..', schemaLocation);
    await convert(includePath)
  }

  convertToTypes(schema)

}

async function run() {
  const [_, __, filePath] = process.argv
  if (!filePath) throw new Error('No filepath specified');

  convert(filePath)
}

run()
