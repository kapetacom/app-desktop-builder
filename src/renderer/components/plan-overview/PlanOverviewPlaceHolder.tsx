import React from "react";

import "./PlanOverview.less";

interface PlanOverviewPlaceHolderProps{
    children:JSX.Element
}

const PlanOverviewPlaceHolder = (props:PlanOverviewPlaceHolderProps)=>{

    return <div className="plan-overview-placeholder">{props.children}</div>
}

export default PlanOverviewPlaceHolder;