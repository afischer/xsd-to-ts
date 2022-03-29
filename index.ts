import ts from "typescript";

import {Annotation, BuiltInType, Restriction, SimpleType} from './types'

const file = ts.createSourceFile("source.ts", "", ts.ScriptTarget.ESNext, false, ts.ScriptKind.TS);
const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });


const stringTypeRef = ts.factory.createTypeReferenceNode("string");
const numberTypeRef = ts.factory.createTypeReferenceNode("number");

// eventually  we will need to store all type refs in scope I guess
const getTypeRefForBaseType = (type: BuiltInType | string) => {
  switch (type) {
    case "xs:":
    case 'xs:string':
    case 'xs:date':
    case 'xs:dateTime':
    case 'xs:time':
      return ts.factory.createTypeReferenceNode("string");

    case 'xs:boolean':
      return ts.factory.createTypeReferenceNode("boolean");

    case 'xs:decimal':
    case 'xs:int':
    case 'xs:integer':
      return ts.factory.createTypeReferenceNode("number");

    default:
      throw new Error(`Unrecognized base type ${type}`)
  }
}

const getTypeForRestriction = (restriction: Restriction, name: string) => {
  if (restriction['xs:enumeration']) {
    // TODO: check xs:base to determine what type of literal to create
    const unionTypeNodeFn = ts.factory.createStringLiteral;
    const enumValuesTypeNodes = restriction["xs:enumeration"].map(x => unionTypeNodeFn(x.value))
    const enumUnionTypeReference = ts.factory.createUnionTypeNode(
      enumValuesTypeNodes.map(ts.factory.createLiteralTypeNode)
    );

    return ts.factory.createTypeAliasDeclaration(
      undefined, // decorators
      undefined, // modifiers
      ts.factory.createIdentifier(name), // name
      undefined, // type parameters
      enumUnionTypeReference // aliased type
    );
  }

  if (
    // TODO: can we do something fun with building out these regular expressions if they are simple enough?
    restriction['xs:pattern']
    || restriction['xs:length']
    // only base type case (odd but valid)
    || Object.keys(restriction).length === 1 && restriction.base

    ) {
    return ts.factory.createTypeAliasDeclaration(
      undefined, // decorators
      undefined, // modifiers
      ts.factory.createIdentifier(name), // name
      undefined, // type parameters
      getTypeRefForBaseType(restriction.base) // aliased type
    );
  }

  throw new Error(`Unimplemented restriction type. Keys: ${Object.keys(restriction)}`)
}


const generateDocComment = (annotation: Annotation): string | void => {
  if (!annotation["xs:documentation"]) return;
  return `/* ${annotation["xs:documentation"].join('\n* ')} */`;
}

export const generateSimpleType = (simpleTypeDef: SimpleType) => {
  const [annotation] = simpleTypeDef["xs:annotation"] ?? [];
  const docComment = annotation ? generateDocComment(annotation) : null;
  if (docComment) console.log(docComment);

  // RESTRICTION
  // if (simpleTypeDef['xs:restriction'])
  const [restriction] = simpleTypeDef['xs:restriction'];
  const decl = getTypeForRestriction(restriction, simpleTypeDef.name);

  const result = printer.printNode(ts.EmitHint.Unspecified, decl, file);
  console.log(result);
  console.log('')

  //
}
