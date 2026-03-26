import React, { useState, useEffect } from 'react';

interface PageTransitionProps {
  transitionKey: string;
  children: React.ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ transitionKey, children }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    setIsTransitioning(true);
    
    // Smooth transition timeout
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsTransitioning(false);
    }, 250); // 250ms duration for snappy yet visible transition

    return () => clearTimeout(timer);
  }, [transitionKey, children]);

  return (
    <div className="relative flex flex-col flex-1 h-full w-full overflow-hidden">
      {/* Top Loading Progress Line */}
      {isTransitioning && (
        <div 
          className="absolute top-0 left-0 h-[3px] bg-linear-to-r from-primary to-emerald-400 z-50 loading-progress-slide"
          style={{ width: '40%' }} // Initial width, animated via css classes if we want, or just a sliding element.
        ></div>
      )}

      {/* Main Content Area with Fade/Slide Transition */}
      <div 
        className={`flex-1 overflow-hidden flex flex-col transition-all duration-300 ease-out custom-scrollbar ${
          isTransitioning ? 'opacity-0 scale-[0.99] translate-y-2' : 'opacity-100 scale-100 translate-y-0'
        }`}
      >
        {displayChildren}
      </div>
    </div>
  );
};

export default PageTransition;
