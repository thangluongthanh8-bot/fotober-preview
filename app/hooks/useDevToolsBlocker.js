import { useState, useRef, useCallback, useEffect } from "react";

/**
 * Hook này chịu TRÁCH NHIỆM DUY NHẤT:
 * Phát hiện DevTools và trả về trạng thái [isOpen]
 */
export function useDevToolsBlocker() {
    const [isOpen, setIsOpen] = useState(false);
    const initialSize = useRef({
        width: window.outerWidth,
        height: window.outerHeight,
    });

    const onDevToolsOpen = useCallback(() => {   
        
        setIsOpen(true);
    }, []); 

    useEffect(() => {
        class DevToolsChecker extends Error {
            toString() { return ""; }
            get message() { 
                onDevToolsOpen();
                return "";
            }
        }
        console.log(new DevToolsChecker());
    }, [onDevToolsOpen]);

    useEffect(() => {
        const handleResize = () => {
            if (isOpen) return;

            const newWidth = window.outerWidth;
            const newHeight = window.outerHeight;
            if (
                Math.abs(newWidth - initialSize.current.width) > 100 ||
                Math.abs(newHeight - initialSize.current.height) > 100
            ) {
                onDevToolsOpen();
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [initialSize]); // Chạy lại nếu isOpen thay đổi

    return { isDevToolOpen: isOpen };
}
