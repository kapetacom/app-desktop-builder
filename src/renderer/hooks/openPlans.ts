import { useLocalStorage } from 'react-use';

export const useOpenPlans = () => {
    const [openPlanRefs, setOpenPlanRefs] = useLocalStorage<string[]>('$main_openPlans', []);

    const addOpenPlanRef = (ref: string) => {
        if (openPlanRefs && !openPlanRefs.includes(ref)) {
            setOpenPlanRefs([...openPlanRefs, ref]);
        }
    };

    const removeOpenPlanRef = (ref: string) => {
        if (openPlanRefs && openPlanRefs.includes(ref)) {
            setOpenPlanRefs(openPlanRefs.filter((r) => r !== ref));
        }
    };

    return {
        openPlanRefs,
        addOpenPlanRef,
        removeOpenPlanRef,
    };
};
