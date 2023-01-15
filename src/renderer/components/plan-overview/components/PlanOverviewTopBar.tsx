import React from 'react';
import "./PlanOverviewTopBar.less";
import { SidePanel } from '@blockware/ui-web-components';
import { AssetService } from '@blockware/ui-web-context';
import PlanImport from './PlanImport';

export interface IPlanOverviewTopBarProps {
  skipFiles: string[]
  open: boolean
  onDone: () => void
  onClose: () => void
}

export function PlanOverviewTopBar(props: IPlanOverviewTopBarProps) {
  const createPanel = React.createRef<SidePanel>();

  return (
    <div className="plan-overview-top-bar">
      <PlanImport
        skipFiles={props.skipFiles}
        assetService={AssetService}
        onDone={() => {
          props.onDone();
          createPanel.current && createPanel.current.close()
        }} />
         </div>
  );
}


