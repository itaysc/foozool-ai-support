import { useEffect } from "react";

function useBlockNavigation(blockNavigation: boolean, msg: string = 'You have unsaved changes, are you sure you want to leave?') {
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
          if (blockNavigation) {
            if (!window.confirm(msg)) {
                e.preventDefault();
                e.returnValue = ''; // required for most browsers
              }
          }
        };
      
        window.addEventListener('beforeunload', handleBeforeUnload);
      
        return () => {
          window.removeEventListener('beforeunload', handleBeforeUnload);
        };
      }, [blockNavigation]);
}

export default useBlockNavigation;