import React, { SetStateAction, useState } from 'react';

export function useLocalStorage<T>(
    name: string,
    initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
    function save(value: T) {
        window.localStorage.setItem(name, JSON.stringify(value));
    }

    const raw = window.localStorage.getItem(name);
    let item: T;
    if (raw) {
        item = JSON.parse(raw);
    } else {
        item = initialValue;
        save(item);
    }

    const [state, setState] = useState<T>(item);

    return [
        state,
        (setStateAction: SetStateAction<T>): void => {
            if (setStateAction instanceof Function) {
                setState((prevState: T): T => {
                    const newState = setStateAction(prevState);
                    save(newState);
                    return newState;
                });
            } else {
                setState(setStateAction);
                save(setStateAction);
            }
        },
    ];
}
