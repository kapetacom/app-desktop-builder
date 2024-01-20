/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */
import { DSLDataType, DSLEntity, DSLEntityType } from '@kapeta/kaplang-core';

export function toDataTypes(results: DSLEntity[]): DSLDataType[] {
    return results.filter((result) => {
        return result.type === DSLEntityType.DATATYPE;
    }) as DSLDataType[];
}
