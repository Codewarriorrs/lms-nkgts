'use client';

import React, { Children, cloneElement, forwardRef, isValidElement, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import styles from "./CardSwap.module.css";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  customClass?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({ customClass, className, ...rest }, ref) => (
  <div
    ref={ref}
    {...rest}
    className={`${styles.card} ${customClass ?? ""} ${className ?? ""}`.trim()}
  />
));
Card.displayName = "Card";

interface CardSwapProps {
  width?: number | string;
  height?: number | string;
  cardDistance?: number;
  verticalDistance?: number;
  delay?: number;
  pauseOnHover?: boolean;
  onCardClick?: (idx: number) => void;
  skewAmount?: number;
  easing?: "linear" | "elastic";
  children: React.ReactNode;
}

const makeSlot = (i: number, distX: number, distY: number, total: number) => ({
  x: i * distX,
  y: -i * distY,
  z: -i * distX * 1.5,
  zIndex: total - i,
});

const placeNow = (el: HTMLDivElement, slot: ReturnType<typeof makeSlot>, skew: number) =>
  gsap.set(el, {
    x: slot.x,
    y: slot.y,
    z: slot.z,
    xPercent: -50,
    yPercent: -50,
    skewY: 0,
    transformOrigin: "center center",
    zIndex: slot.zIndex,
    force3D: true,
  });

const CardSwap = ({
  width = 500,
  height = 400,
  cardDistance = 60,
  verticalDistance = 70,
  delay = 5000,
  pauseOnHover = false,
  onCardClick,
  skewAmount = 0,
  easing = "elastic",
  children,
}: CardSwapProps) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth <= 640);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const actualCardDistance = isMobile ? 0 : cardDistance;
  const actualVerticalDistance = isMobile ? 0 : verticalDistance;
  const actualSkewAmount = isMobile ? 0 : skewAmount;
  const parseSize = (value: number | string) =>
    typeof value === "number" ? value : parseFloat(value.toString()) || 0;

  const dropDistance = Math.min(80, parseSize(height) * 0.25 || 60);
  const config =
    easing === "elastic"
      ? {
          ease: "elastic.out(0.6,0.9)",
          durDrop: 2,
          durMove: 2,
          durReturn: 2,
          promoteOverlap: 0.9,
          returnDelay: 0.05,
        }
      : {
          ease: "power1.inOut",
          durDrop: 0.8,
          durMove: 0.8,
          durReturn: 0.8,
          promoteOverlap: 0.45,
          returnDelay: 0.2,
        };

  const childArr = useMemo(
    () => Children.toArray(children) as React.ReactElement<React.HTMLAttributes<HTMLDivElement>>[],
    [children]
  );
  const refs = useMemo(
    () => childArr.map(() => React.createRef<HTMLDivElement>()),
    [childArr.length]
  );

  const order = useRef<number[]>([]);
  useEffect(() => {
    order.current = Array.from({ length: childArr.length }, (_, i) => i);
  }, [childArr.length]);

  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const intervalRef = useRef<number | undefined>(undefined);
  const container = useRef<HTMLDivElement | null>(null);

  const clearSwapInterval = () => {
    if (intervalRef.current !== undefined) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  };

  useEffect(() => {
    const total = refs.length;
    refs.forEach((r, i) => {
      if (r.current) {
        placeNow(r.current, makeSlot(i, actualCardDistance, actualVerticalDistance, total), actualSkewAmount);
      }
    });

    const swap = () => {
      if (order.current.length < 2) return;

      const [front, ...rest] = order.current;
      const elFront = refs[front]?.current;
      if (!elFront) return;

      const tl = gsap.timeline();
      tlRef.current = tl;

      tl.to(elFront, {
        y: `+=${dropDistance}`,
        duration: config.durDrop,
        ease: config.ease,
      });

      tl.addLabel("promote", `-=${config.durDrop * config.promoteOverlap}`);
      rest.forEach((idx, i) => {
        const el = refs[idx]?.current;
        if (!el) return;
        const slot = makeSlot(i, actualCardDistance, actualVerticalDistance, refs.length);
        tl.set(el, { zIndex: slot.zIndex }, "promote");
        tl.to(
          el,
          {
            x: slot.x,
            y: slot.y,
            z: slot.z,
            duration: config.durMove,
            ease: config.ease,
          },
          `promote+=${i * 0.15}`
        );
      });

      const backSlot = makeSlot(refs.length - 1, actualCardDistance, actualVerticalDistance, refs.length);
      tl.addLabel("return", `promote+=${config.durMove * config.returnDelay}`);
      tl.call(
        () => {
          gsap.set(elFront, { zIndex: backSlot.zIndex });
        },
        undefined,
        "return"
      );
      tl.to(
        elFront,
        {
          x: backSlot.x,
          y: backSlot.y,
          z: backSlot.z,
          duration: config.durReturn,
          ease: config.ease,
        },
        "return"
      );

      tl.call(() => {
        order.current = [...rest, front];
      });
    };

    swap();
    intervalRef.current = window.setInterval(swap, delay);

    if (pauseOnHover) {
      const node = container.current;
      const pause = () => {
        tlRef.current?.pause();
        clearSwapInterval();
      };
      const resume = () => {
        tlRef.current?.play();
        intervalRef.current = window.setInterval(swap, delay);
      };
      node?.addEventListener("mouseenter", pause);
      node?.addEventListener("mouseleave", resume);
      return () => {
        node?.removeEventListener("mouseenter", pause);
        node?.removeEventListener("mouseleave", resume);
        clearSwapInterval();
      };
    }

    return () => {
      clearSwapInterval();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardDistance, verticalDistance, delay, pauseOnHover, skewAmount, easing]);

  const rendered = childArr.map((child, i) => {
    if (!isValidElement(child)) return child;

    const element = child as React.ReactElement<React.HTMLAttributes<HTMLDivElement>>;
    const style = { width, height, ...(element.props.style ?? {}) };

    return cloneElement(element, {
      key: i,
      ref: refs[i] as React.Ref<HTMLDivElement>,
      style,
      onClick: (e: React.MouseEvent<HTMLDivElement>) => {
        element.props.onClick?.(e);
        onCardClick?.(i);
      },
    } as any);
  });

  return (
    <div ref={container} className={styles.cardSwapContainer} style={{ width, height }}>
      {rendered}
    </div>
  );
};

export default CardSwap;
