
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedContainerProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  animation?: "fade-in" | "slide-up" | "slide-down";
}

const AnimatedContainer = ({
  children,
  className,
  delay = 0,
  animation = "fade-in",
}: AnimatedContainerProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const animationClasses = {
    "fade-in": "opacity-0 animate-fade-in",
    "slide-up": "opacity-0 translate-y-4 animate-slide-up",
    "slide-down": "opacity-0 -translate-y-4 animate-slide-down",
  };

  return (
    <div
      className={cn(
        "transition-all duration-500",
        isVisible ? animationClasses[animation] : "opacity-0",
        className
      )}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "forwards",
      }}
    >
      {children}
    </div>
  );
};

export default AnimatedContainer;
