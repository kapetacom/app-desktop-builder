import React from 'react';
import "./PlanOverviewTopBar.less";
import { SidePanel } from '@blockware/ui-web-components';
import { AssetService } from '@blockware/ui-web-context';
import PlanImport from './PlanImport';
import {Asset} from "@blockware/ui-web-types";

interface Props {
  skipFiles: string[]
  onDone: (asset?:Asset) => void
}

export function PlanOverviewTopBar(props: Props) {
  const createPanel = React.createRef<SidePanel>();

  return (
    <div className="plan-overview-top-bar">
      <PlanImport
        skipFiles={props.skipFiles}
        assetService={AssetService}
        onDone={(asset?:Asset) => {
          props.onDone(asset);
          createPanel.current && createPanel.current.close()
        }} />
         </div>
  );
}


