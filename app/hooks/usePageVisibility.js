import { useEffect } from "react";

/**
 * Hook này chịu TRÁCH NHIỆM DUY NHẤT:
 * Kiểm tra xem tab có đang được active hay không
 * @param {boolean} enabled - Chỉ kích hoạt khi enabled = true (ví dụ: đang ở tab video)
 */
export function usePageVisibility(enabled = false) {
    useEffect(() => {
        // Chỉ kích hoạt khi enabled = true
        if (!enabled) return;

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
    }, [enabled]);
}
