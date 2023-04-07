import React from 'react';
import {
    PlannerMode,
} from '@kapeta/ui-web-plan-editor';

import { AssetService, BlockService } from '@kapeta/ui-web-context';

import './PlanView.less';
import {Asset, PlanKind} from '@kapeta/ui-web-types';
import {parseKapetaUri} from '@kapeta/nodejs-utils';
import { SimpleLoader } from '@kapeta/ui-web-components';
import {PlanEditor} from "../components/plan-editor/PlanEditor";
import {useAsync} from "react-use";

interface PlanViewProps {
    systemId: string;
}

export const PlanView = (props: PlanViewProps) => {


    const planData = useAsync(async ():Promise<Asset<PlanKind>> => {
        return AssetService.get(props.systemId);
    },[props.systemId]);

    let plannerMode: PlannerMode = PlannerMode.EDIT;

    const uri = parseKapetaUri(props.systemId);

    if (uri.version !== 'local') {
        // We can only edit local versions
        plannerMode = PlannerMode.CONFIGURATION;
    }

    const blocks = useAsync(async () => {
        return BlockService.list()
    })

    return (
        <SimpleLoader loading={planData.loading || blocks.loading} text="Loading plan...">
            {planData.value && (
                <PlanEditor
                    plan={planData.value.data}
                    mode={plannerMode}
                    systemId={props.systemId}
                    blockAssets={blocks.value ?? []}
                />
            )}
        </SimpleLoader>
    );
};
