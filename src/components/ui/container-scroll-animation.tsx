"use client";
import { useRef, useState, useEffect, ReactNode, MutableRefObject } from "react";
import { useScroll, useTransform, motion, MotionValue, AnimatePresence } from "framer-motion";
import { useSpacemanTheme } from "@space-man/react-theme-animation";
import { useCentralizedIntersection } from "@/hooks/ui/use-centralized-intersection";

export const ContainerScroll = ({
  titleComponent,
  images,
}: {
  titleComponent: string | ReactNode;
  images: { src: string; srcDark?: string; alt: string }[];
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Use native window scroll (no custom container needed)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "center center"],
  });
  const [isMobile, setIsMobile] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { theme } = useSpacemanTheme();
  const [mounted, setMounted] = useState(false);

  // Filter images for mobile to show only domain and voice
  const getFilteredImages = () => {
    if (isMobile) {
      return images.filter(img =>
        img.src.includes('domain') || img.src.includes('voice')
      );
    }
    return images;
  };

  const filteredImages = getFilteredImages();

  const { ref: intersectionRef, isVisible } = useCentralizedIntersection({
    threshold: 0.1,
    once: false,
  });

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isVisible) {
      intervalId = setInterval(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % filteredImages.length);
      }, 5000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isVisible, filteredImages.length]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const scaleDimensions = () => {
    return isMobile ? [0.7, 0.9] : [1.05, 1];
  };

  const rotate = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);

  const getCurrentImageSrc = (image: { src: string; srcDark?: string; alt: string }) => {
    if (!mounted) return image.src;
    const isDark = theme === 'dark';
    return isDark && image.srcDark ? image.srcDark : image.src;
  };

  const setRefs = (node: HTMLDivElement) => {
    if (node) {
      containerRef.current = node;
      (intersectionRef as MutableRefObject<HTMLDivElement | null>).current = node;
    }
  };

  return (
    <div
      className="h-[35rem] sm:h-[40rem] md:h-[50rem] flex items-center justify-center relative p-2 md:p-20"
      ref={setRefs}
    >
      <div
        className="py-10 md:py-40 w-full relative"
        style={{
          perspective: "1000px",
        }}
      >
        <Header translate={translate} titleComponent={titleComponent} />
        <Card
          rotate={rotate}
          translate={translate}
          scale={scale}
          images={filteredImages}
          currentImageIndex={currentImageIndex}
          getCurrentImageSrc={getCurrentImageSrc}
        />
        <NavigationDots
          images={filteredImages}
          currentImageIndex={currentImageIndex}
          onImageSelect={setCurrentImageIndex}
        />
      </div>
    </div>
  );
};

export const Header = ({ translate, titleComponent }: any) => {
  return (
    <motion.div
      style={{
        translateY: translate,
      }}
      className="div max-w-5xl mx-auto text-center relative z-20 -mb-8 md:-mb-12"
    >
      {titleComponent}
      <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mt-4 font-light">
        Experience the future of interview preparation with structured resources curated for you
      </p>
    </motion.div>
  );
};

export const Card = ({
  rotate,
  scale,
  images,
  currentImageIndex,
  getCurrentImageSrc,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  translate: MotionValue<number>;
  images: { src: string; srcDark?: string; alt: string }[];
  currentImageIndex: number;
  getCurrentImageSrc: (image: { src: string; srcDark?: string; alt: string }) => string;
}) => {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow:
          "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
      }}
      className="max-w-5xl mt-8 md:mt-12 lg:mt-16 mx-auto h-[25rem] sm:h-[30rem] md:h-[40rem] w-full border-4 border-[#6C6C6C] p-2 md:p-6 bg-[#222222] rounded-[30px] shadow-2xl"
    >
      <div className="h-full w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-zinc-900 md:rounded-2xl md:p-4 relative">
        <AnimatePresence mode="wait">
          {images.length > 0 && images[currentImageIndex] && (
            <motion.img
              key={`${currentImageIndex}-${getCurrentImageSrc(images[currentImageIndex])}`}
              src={getCurrentImageSrc(images[currentImageIndex])}
              alt={images[currentImageIndex].alt}
              className="mx-auto rounded-2xl object-cover h-full w-full object-top sm:object-left-top"
              draggable={false}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export const NavigationDots = ({
  images,
  currentImageIndex,
  onImageSelect,
}: {
  images: { src: string; alt: string }[];
  currentImageIndex: number;
  onImageSelect: (index: number) => void;
}) => {
  return (
    <div className="flex justify-center mt-6 sm:mt-8 space-x-1 sm:space-x-1.5">
      {images.length > 0 && images.map((_, index) => (
        <button
          key={index}
          onClick={() => onImageSelect(index)}
          className="relative group focus:outline-none p-1 sm:p-1.5"
          aria-label={`View image ${index + 1}`}
        >
          <motion.div
            className={`rounded-full transition-all duration-500 ease-out ${index === currentImageIndex
              ? 'w-4 sm:w-6 h-1 sm:h-1.5 bg-gray-900 dark:bg-white'
              : 'w-1 sm:w-1.5 h-1 sm:h-1.5 bg-gray-300 dark:bg-gray-600 group-hover:bg-gray-400 dark:group-hover:bg-gray-500'
              }`}
            animate={{
              width: index === currentImageIndex ? 24 : 6,
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          />
        </button>
      ))}
    </div>
  );
};
