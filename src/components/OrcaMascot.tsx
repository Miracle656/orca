import { motion } from "framer-motion";
import coolOrca from "../assets/cool_orca.png";

export function OrcaMascot() {
    return (
        <motion.div
            initial={{ x: -100, opacity: 0, rotate: -5 }}
            animate={{ x: 0, opacity: 1, rotate: 0 }}
            transition={{
                type: "spring",
                stiffness: 50,
                damping: 15,
                delay: 0.2,
                duration: 1
            }}
            className="relative w-64 h-64 md:w-96 md:h-96 z-50 cursor-pointer"
            whileHover={{
                scale: 1.05,
                rotate: 5,
                transition: { duration: 0.2 }
            }}
        >
            <img
                src={coolOrca}
                alt="Cool Orca Mascot"
                className="w-full h-full object-contain drop-shadow-[8px_8px_0px_rgba(0,0,0,1)]"
            />
        </motion.div>
    );
}
