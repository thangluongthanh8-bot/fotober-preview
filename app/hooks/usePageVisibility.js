import { useEffect } from "react";

/**
 * Hook này chịu TRÁCH NHIỆM DUY NHẤT:
 * Kiểm tra xem tab có đang được active hay không
 */
export function usePageVisibility() {
    useEffect(() => {
        const handleReload = () => {
            window.location.reload();
        };

        window.addEventListener("blur", handleReload);
        // window.addEventListener("focus", handleReload);
        window.addEventListener("visibilitychange", handleReload);

        return () => {
            window.removeEventListener("blur", handleReload);
            // window.removeEventListener("focus", handleReload);
            window.removeEventListener("visibilitychange", handleReload);
        };
    }, []);
}
