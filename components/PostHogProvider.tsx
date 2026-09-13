"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider as PostHogReactProvider } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

interface PostHogProviderProps {
  apiKey?: string;
  children: React.ReactNode;
}

export default function PostHogProvider({
  apiKey,
  children,
}: PostHogProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!apiKey) return;
    if (
      typeof window !== "undefined" &&
      LOCAL_HOSTNAMES.has(window.location.hostname)
    ) {
      return;
    }
    posthog.init(apiKey, {
      api_host: "https://us.i.posthog.com",
      person_profiles: "identified_only",
    });
  }, [apiKey]);

  useEffect(() => {
    if (!posthog.__loaded) return;
    const query = searchParams?.toString();
    const url =
      window.location.pathname + (query ? `?${query}` : "");
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return (
    <PostHogReactProvider client={posthog}>{children}</PostHogReactProvider>
  );
}