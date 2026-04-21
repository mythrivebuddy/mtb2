"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import useAnnouncements from "@/hooks/use-announcement";


export default function AnnouncementBar() {
 
    const { currentAnnouncement, currentIndex } = useAnnouncements();
    if (!currentAnnouncement) {
        return null;
    }
    return (
        <>
            <div className=" mx-0 px-3 sm:px-4 relative mb-4  h-[40px] text-center overflow-hidden">
                <AnimatePresence mode="wait">
                    {currentAnnouncement && (
                        <motion.div
                            key={currentAnnouncement._id || currentIndex}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.6, ease: "easeInOut" }}
                            className="h-[30px]  sm:h-[40px] min-h-fit flex items-center justify-center shadow-sm  rounded-sm"
                            style={{
                                backgroundColor:
                                    currentAnnouncement.backgroundColor ?? "#f8f9fa",
                                color: currentAnnouncement.fontColor ?? "#000",
                            }}
                        >

                            <Link
                                href={currentAnnouncement.linkUrl ?? "#"}
                                target={
                                    currentAnnouncement.openInNewTab ? "_blank" : "_self"
                                }
                                rel="noopener noreferrer"
                                className="inline-block px-2 text-xs sm:text-sm font-semibold"
                            >
                                {currentAnnouncement.title}
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

        </>

    );
}