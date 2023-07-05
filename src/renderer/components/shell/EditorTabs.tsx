import { Plan } from '@kapeta/schemas';
import { Asset } from '@kapeta/ui-web-types';
import { PlannerService } from '@kapeta/ui-web-context';
import { Button, Tab, Tabs } from '@mui/material';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAsyncRetry, useLocalStorage } from 'react-use';
import { getAssetTitle } from '../plan-editor/helpers';

export const EditorTabs = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const planAssets = useAsyncRetry(() => PlannerService.list(), []);

    const [openPlanRefs, setOpenPlanRefs] = useLocalStorage<string[]>(
        '$main_openPlans',
        []
    );

    useEffect(() => {
        const match = /\/plans\/(.*)/.exec(location.pathname);
        if (match) {
            const ref = decodeURIComponent(match[1]);
            setOpenPlanRefs((refs) =>
                refs?.includes(ref) ? refs : [...(refs || []), ref]
            );
        }
    }, [location.pathname, setOpenPlanRefs]);

    const onTabClosed = (plan: Asset<Plan>) => {
        const i = openPlanRefs?.findIndex((ref) => ref === plan.ref) ?? -1;
        const newTab =
            i > -1 ? openPlanRefs?.[i - 1] || openPlanRefs?.[i + 1] : null;
        if (newTab) {
            const to = `/plans/${encodeURIComponent(newTab)}`;
            navigate(to);
        } else {
            navigate('/plans');
        }

        setTimeout(() => {
            setOpenPlanRefs((refs) =>
                refs?.filter((ref) => {
                    return ref !== plan.ref;
                })
            );
        }, 20);
    };

    return (
        <Tabs
            sx={(theme) => ({
                '& .MuiTabs-indicator': {
                    display: 'none',
                },
                '& .MuiButton-root': {
                    color: theme.palette.common.white,
                },
            })}
            value={location.pathname}
        >
            {openPlanRefs?.map((ref) => {
                const plan = planAssets.value?.find((plan) => plan.ref === ref);
                return (
                    <Tab
                        sx={(theme) => ({
                            '&.Mui-selected': {
                                backgroundColor: theme.palette.primary.main,
                                color: theme.palette.common.white,
                            },
                        })}
                        value={`/plans/${encodeURIComponent(ref)}`}
                        href={`/plans/${encodeURIComponent(ref)}`}
                        key={ref}
                        label={
                            <div>
                                {plan
                                    ? `${getAssetTitle(plan)} [${
                                          plan.version
                                      }]}`
                                    : 'Loading...'}
                                <button
                                    style={{
                                        all: 'unset',
                                    }}
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onTabClosed(plan);
                                    }}
                                >
                                    <i className="fal fa-times close-plan" />
                                </button>
                            </div>
                        }
                    />
                );
            })}
            <Button href="/plans">
                <i className="fa fa-plus add-plan" />
            </Button>
        </Tabs>
    );
};
