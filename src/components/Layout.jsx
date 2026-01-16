import React from 'react';

const Layout = ({ children }) => {
    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-background text-white selection:bg-primary/30">
            {/* Animated Background Blobs */}
            <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[100px] animate-blob" />
            <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 w-[600px] h-[600px] rounded-full bg-secondary/20 blur-[100px] animate-blob animation-delay-2000" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-accent/10 blur-[120px] animate-pulse" />

            {/* Content Wrapper */}
            <div className="relative z-10 min-h-screen flex flex-col">
                {children}
            </div>
        </div>
    );
};

export default Layout;
