// localStorage helper functions

export const setLocalStorage = (key, value) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(value));
    }
};

export const getLocalStorage = (key) => {
    if (typeof window !== 'undefined') {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    }
    return null;
};

export const removeLocalStorage = (key) => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
    }
}

