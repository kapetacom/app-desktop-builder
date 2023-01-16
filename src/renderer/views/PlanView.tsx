import React, {useEffect, useState} from "react";
import {Planner, PlannerMode, PlannerModelReader, PlannerModelWrapper} from "@blockware/ui-web-plan-editor";
import {Lambda, reaction} from "mobx";
import _ from 'lodash';

import {AssetService, BlockService, InstanceService} from "@blockware/ui-web-context";

import Menu from "../components/menu/MenuWrapper";
import BlockStore from "../components/blocks/store/BlockStore";

import './PlanView.less';
import {Asset} from "@blockware/ui-web-types";
import {SimpleLoader} from "@blockware/ui-web-components";

function getVersionFromRef(ref: string) {
  if (ref.indexOf('://') > -1) {
    ref = ref.split('://')[1];
  }

  const [, version] = ref.split(':');
  return version;
}

interface PlanViewProps {
  planRef: string
}

export const PlanView = (props: PlanViewProps) => {
  const reader: PlannerModelReader = new PlannerModelReader(BlockService);
  let planModelObserver: Lambda | undefined = undefined;

  function cleanupObserver() {
    if (planModelObserver) {
      planModelObserver();
      planModelObserver = undefined;
    }
  }

  const [asset, setAsset] = useState<Asset>();
  const [model, setModal] = useState<PlannerModelWrapper>();

  const loader = async () => {
    const assetData = await AssetService.get(props.planRef);
    const modelData = await reader.load(assetData.data, props.planRef);

    const version = getVersionFromRef(props.planRef);
    if (!version || version.toLowerCase() !== 'local') {
      //We can only edit local versions
      modelData.setMode(PlannerMode.VIEW);
    }

    cleanupObserver();
    planModelObserver = reaction(() => modelData, _.debounce(async () => {
      await AssetService.update(props.planRef, modelData.getData());
    }, 1000));

    setAsset(assetData);
    setModal(modelData);
  }

  useEffect(() => {
    return cleanupObserver;
  }, []);

  return (
    <SimpleLoader loader={loader} text={'Loading plan...'}>
      {model && asset &&
        <div className={'plan-view'}>
          <Planner plan={model}
                   systemId={props.planRef}
                   blockStore={() => <BlockStore/>}
                   enableInstanceListening={true}/>
          <Menu menuCategoryItems={[
            {
              open: false,
              index: 1,
              text: "1",
              icon: "fa-running",
              menuItems: [
                {
                  text: "Stop all",
                  callback: () => {
                    InstanceService.stopInstances(props.planRef);
                    return true;
                  }
                },
                {
                  text: "Start all",
                  callback: () => {
                    InstanceService.startInstances(props.planRef);
                    return true;
                  }
                }
              ]
            }]}
          />
        </div>}
    </SimpleLoader>
  );
}


