import React from "react";
import {createHexagonPath, Orientation} from "@blockware/ui-web-utils";

interface PlanOverviewItemHexagonProps {
    onClick: () => void
}

export default function PlanOverviewItemHexagon(props: PlanOverviewItemHexagonProps) {

    const dimension = 300;
    return (
        <svg className={"plan-overview-item-background"} x="-50" y="20">
            <defs>
                <filter id="dropshadow" height="140%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="5" />
                    <feOffset dx="0"  dy="1" result="offsetblur" />
                    <feComponentTransfer>
                        <feFuncA  type="linear" slope="0.2" />
                    </feComponentTransfer>
                    <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            <path filter="url(#dropshadow)" style={{ transition: "d 500ms" }}
                d={createHexagonPath(dimension, dimension, 10, Orientation.VERTICAL, dimension * 0.20)}
                onClick={props.onClick} >
            </path>
        </svg>
    )
}