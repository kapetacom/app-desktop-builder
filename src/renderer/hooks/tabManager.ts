import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Tab {
    id: number;
    url: string;
}

export const useTabManager = () => {
    const [tabs, setTabs] = useState<Tab[]>([]);
    const [activeTab, setActiveTab] = useState<Tab | null>(null);
    const navigate = useNavigate();

    const openTab = (url: string) => {
        const newTab: Tab = {
            id: Date.now(),
            url,
        };
        setTabs((prevTabs) => [...prevTabs, newTab]);
        setActiveTab(newTab);
        navigate(url);
    };

    const closeTab = (tabId: number) => {
        setTabs((prevTabs) => prevTabs.filter((tab) => tab.id !== tabId));
        if (activeTab?.id === tabId) {
            setActiveTab(null);
            navigate('/');
        }
    };

    const switchTab = (tabId: number) => {
        const tabToSwitch = tabs.find((tab) => tab.id === tabId);
        if (tabToSwitch) {
            setActiveTab(tabToSwitch);
            navigate(tabToSwitch.url);
        }
    };

    useEffect(() => {
        window.electron.ipcRenderer.on('ipc-main', (...args) =>
            console.log(args)
        );
    }, []);

    return {
        tabs,
        activeTab,
        openTab,
        closeTab,
        switchTab,
    };
};
