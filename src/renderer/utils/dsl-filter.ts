import { DSLDataType, DSLEntity, DSLEntityType } from '@kapeta/kaplang-core';

export function toDataTypes(results: DSLEntity[]): DSLDataType[] {
    return results.filter((result) => {
        return result.type === DSLEntityType.DATATYPE;
    }) as DSLDataType[];
}
