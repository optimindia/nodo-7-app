import { motion } from 'framer-motion';

const LoadingFallback = () => {
    return (
        <div className="flex items-center justify-center h-full w-full min-h-[50vh]">
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center"
            >
                <div className="w-4 h-4 rounded-full bg-emerald-500" />
            </motion.div>
        </div>
    );
};

export default LoadingFallback;
