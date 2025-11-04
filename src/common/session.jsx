const storeInSession = (key, value) => {
    return sessionStorage.setItem(key, value);
}

const lookInSession = (key) => {
    return sessionStorage.getItem(key)
}

const removeFromSession = (key) => {
    return sessionStorage.removeItem(key)
}

// localStorage helpers for persistent auth/theme
const storeInLocal = (key, value) => {
    try {
        return localStorage.setItem(key, value);
    } catch (e) {
        // fallback to session if local unavailable
        return storeInSession(key, value);
    }
}

const lookInLocal = (key) => {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        return lookInSession(key);
    }
}

const removeFromLocal = (key) => {
    try {
        return localStorage.removeItem(key);
    } catch (e) {
        return removeFromSession(key);
    }
}

export { storeInSession, lookInSession, removeFromSession, storeInLocal, lookInLocal, removeFromLocal }