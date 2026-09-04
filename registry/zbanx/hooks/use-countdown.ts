"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseCountdownResult {
  /** 剩余秒数 */
  secondsLeft: number;
  /** 是否正在倒计时 */
  isRunning: boolean;
  /** 倒计时是否已结束（secondsLeft === 0 且曾运行过） */
  isFinished: boolean;
  /** 从指定秒数开始倒计时 */
  start: (seconds?: number) => void;
  /** 重置为 0 并停止 */
  reset: () => void;
}

/**
 * 验证码 / 二维码有效期倒计时 Hook。
 *
 * @param initialSeconds 初始倒计时秒数，默认 60。
 * @param onComplete 倒计时归零时回调（在定时器回调中触发，非渲染期）。
 */
export function useCountdown(
  initialSeconds = 60,
  onComplete?: () => void
): UseCountdownResult {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(
    (seconds?: number) => {
      const total = seconds ?? initialSeconds;
      clear();
      setSecondsLeft(total);
      setIsFinished(false);
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clear();
            setIsFinished(true);
            onCompleteRef.current?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [initialSeconds, clear]
  );

  const reset = useCallback(() => {
    clear();
    setSecondsLeft(0);
    setIsFinished(false);
  }, [clear]);

  useEffect(() => clear, [clear]);

  return {
    secondsLeft,
    isRunning: secondsLeft > 0,
    isFinished,
    start,
    reset,
  };
}
