import ts from "typescript";

import {Annotation, BuiltInType, ComplexType, Restriction, SimpleType} from './types'

const file = ts.createSourceFile("source.ts", "", ts.ScriptTarget.ESNext, false, ts.ScriptKind.TS);
const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });


const stringTypeRef = ts.factory.createTypeReferenceNode("string");
const numberTypeRef = ts.factory.createTypeReferenceNode("number");
const questionToken = ts.factory.createToken(ts.SyntaxKind.QuestionToken);

// eventually  we will need to store all type refs in scope I guess
const getTypeRefForBaseType = (type: BuiltInType | string): ts.TypeReferenceNode => {
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
      return ts.factory.createTypeReferenceNode(type);
  }
}

const getTypeForRestriction = (restriction: Restriction, name: string): ts.TypeAliasDeclaration => {
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
  // TODO: types without a restriction, if they exist?
  // if (simpleTypeDef['xs:restriction'])
  const [restriction] = simpleTypeDef['xs:restriction'];
  const decl = getTypeForRestriction(restriction, simpleTypeDef.name);

  const result = printer.printNode(ts.EmitHint.Unspecified, decl, file);
  console.log(result);
  console.log('')

  //
}


export const generateComplexType = (complexTypeDef: ComplexType) => {
  const propertySignatures = [];

  // TODO: parse CHOICE

  // parse sequences
  if (complexTypeDef["xs:sequence"]) {
    const [sequence] = complexTypeDef["xs:sequence"];
    // TODO: other types of sequences
    // element sequence
    if (sequence["xs:element"]) {
      const signatures = sequence["xs:element"].map(el => {
        return ts.factory.createPropertySignature(
          undefined,
          el.name,
          el.minOccurs === '0' ? questionToken : undefined,
          ts.factory.createArrayTypeNode(getTypeRefForBaseType(el.type))
        )
      })
      propertySignatures.push(...signatures)
    } else {
      throw new Error(`Unimplemented complexType with keys ${Object.keys(complexTypeDef)}`)
    }
  }

  // attributes are simple typed
  if (complexTypeDef["xs:attribute"]) {
    const signatures = complexTypeDef["xs:attribute"].map(attribute => {
      return ts.factory.createPropertySignature(
        undefined,
        attribute.name,
        attribute.use === 'optional' ? questionToken : undefined,
        getTypeRefForBaseType(attribute.type)
      )
    })
    propertySignatures.push(...signatures);
  }


  const interfaceDecl = ts.factory.createInterfaceDeclaration(
    undefined,
    undefined,
    complexTypeDef.name,
    undefined,
    undefined,
    propertySignatures
  );
  const result = printer.printNode(ts.EmitHint.Unspecified, interfaceDecl, file);
  console.log(result);
  console.log();
}
