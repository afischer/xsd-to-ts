// utility type that only allows one of the use of one of the keys passed
type OneFrom<T, K extends keyof T> = Omit<T, K> &
  {
    [k in K]: Pick<Required<T>, k> &
      {
        [k1 in Exclude<K, k>]?: never;
      };
  }[K];

// helper type that allows passing an object, where only one key will be allowed
type OneOf<T> = OneFrom<T, keyof T>

export type XSD = {
  'xs:schema': Schema[]
}

type FormDefaultOption = 'qualified' | 'unqualified';

export type BuiltInType = 'xs:string'
  | 'xs:decimal'
  | 'xs:int'
  | 'xs:integer'
  | 'xs:boolean'
  | 'xs:date'
  | 'xs:dateTime'
  | 'xs:time'


type Schema = {
  'xmlns:xs': string;
  elementFormDefault: FormDefaultOption;
  attributeFormDefault: FormDefaultOption;
  'xs:element'?: Element[];
  'xs:include'?: Include[];
  'xs:simpleType'?: SimpleType[];
  'xs:complexType'?: ComplexType[];
}

type Element = {
  name: string,
  type: string,
  minOccurs?: string,
  maxOccurs?: string,
  'xs:annotation'?: Annotation[]
  // can have other internal contents but unsupported for now
}

type Include = {
  schemaLocation: 'odf2-structure.xsd'
}

export type SimpleType = {
  name: string;
  'xs:annotation'?: Annotation[],
  'xs:restriction': Restriction[],
}

export type ComplexType = {
  name: string;
  'xs:annotation'?: Annotation[];
  'xs:sequence': Sequence[]
  'xs:attribute': Attribute[]
}

type Sequence = OneOf<{
  'xs:element': Element[];
  'xs:group': unknown;
  'xs:choice': unknown;
  'xs:sequence': unknown;
  'xs:any': unknown;
}>


export type Annotation = {
  'xs:documentation': string[];
}

export type Restriction = {
  base: BuiltInType | string; // xs: builtin type or another type
  'xs:enumeration'?: {value: any}[];
  'xs:length'?: {value: any}[];
  'xs:pattern'?: {value: any}[];

}


type Attribute = {
  name: string;
  type: BuiltInType | string;
  default?: string;
  use: "required" | "optional";
}

// {
//   'xs:schema': [
//     {
//       'xmlns:xs': 'http://www.w3.org/2001/XMLSchema',
//       elementFormDefault: 'qualified',
//       attributeFormDefault: 'unqualified',
//       'xs:include': [Array],
//       'xs:complexType': [Array]
//     }
//   ]
// }

// {
//   'xs:schema': [
//     {
//       'xmlns:xs': 'http://www.w3.org/2001/XMLSchema',
//       elementFormDefault: 'qualified',
//       attributeFormDefault: 'unqualified',
//       'xs:simpleType': [Array]
//     }
//   ]
// }
