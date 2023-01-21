import React, {useEffect, useState} from "react";
import {PlannerModelWrapper} from "@blockware/ui-web-plan-editor/src/wrappers/PlannerModelWrapper";
import {observer} from "mobx-react";

import './TopMenu.less';
import {toClass} from "@blockware/ui-web-utils";
import {InstanceService} from "@blockware/ui-web-context";
import {showToasty, ToastType} from "@blockware/ui-web-components";

interface Props {
  plan: PlannerModelWrapper
  version:string
  systemId: string
}


export const TopMenu = observer((props:Props) => {

  const [playing,setPlaying] = useState(false);
  const [processing,setProcessing] = useState(false);

  const doProcess = async (handler, errorMsg) => {
    setProcessing(true);
    try {
      const result = await handler();
      if (result && result.error) {
        throw new Error(result.error)
      }
      setPlaying(true);
    } catch (e) {
      showToasty({
        title: errorMsg,
        message: e.message,
        type: ToastType.DANGER
      })
    } finally {
      setProcessing(false);
    }
  }

  const containerClass = toClass({
    'top-menu':true,
    'read-only': props.plan.isReadOnly(),
    playing
  });

  useEffect(() => {
    InstanceService.getInstanceCurrentStatus().then(status => {
      console.log('status', status);
      setPlaying(status.length > 0);
    });
  }, [])


  return (
    <div className={containerClass}>
      <div className={'buttons'}>
        <button disabled={playing || processing} onClick={async () => {
          await doProcess(
            async () => InstanceService.startInstances(props.systemId),
            'Failed to start plan'
          );
        }}>
          <i className={'fa fa-play'} />
          <span>Start</span>
        </button>
        <button disabled={!playing || processing}  onClick={async () => {
          await doProcess(
            async () => InstanceService.stopInstances(props.systemId),
            'Failed to stop plan'
          );
        }}>
          <i className={'fa fa-stop'} />
          <span>Stop</span>
        </button>
      </div>
    </div>
  )
})
