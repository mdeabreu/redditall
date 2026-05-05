export function fetchRedditJsonp(url: string, signal?: AbortSignal): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("JSONP is only available in the browser."));
      return;
    }

    if (signal?.aborted) {
      reject(new DOMException("The operation was aborted.", "AbortError"));
      return;
    }

    const callbackName = `__rillRedditJsonp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const callbackTarget = window as unknown as Record<string, unknown>;
    const script = document.createElement("script");
    const jsonpUrl = new URL(url);
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    function cleanup() {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      script.remove();
      signal?.removeEventListener("abort", onAbort);
      delete callbackTarget[callbackName];
    }

    function onAbort() {
      cleanup();
      reject(new DOMException("The operation was aborted.", "AbortError"));
    }

    callbackTarget[callbackName] = (payload: unknown) => {
      cleanup();
      resolve(payload);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("Reddit JSONP request failed."));
    };

    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("Reddit JSONP request timed out."));
    }, 10000);

    signal?.addEventListener("abort", onAbort, { once: true });
    jsonpUrl.searchParams.set("jsonp", callbackName);
    script.src = jsonpUrl.toString();
    document.head.append(script);
  });
}
