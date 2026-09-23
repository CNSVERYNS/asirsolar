"use client";
import Script from "next/script";
import { preconnect, prefetchDNS } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { marketing } from "@/lib/marketing-config";
type TrackingWindow = Window & { gtag?: (...args: unknown[]) => void; fbq?: (...args: unknown[]) => void };
export default function MarketingScripts() {
  const pathname = usePathname();
  const [gaReady, setGaReady] = useState(false);
  const [pixelReady, setPixelReady] = useState(false);
  const previousGaPath = useRef("");
  const previousPixelPath = useRef("");
  useEffect(() => {
    if (/^\/(admin|teklif|api)(\/|$)/.test(pathname)) return;
    const trackingWindow = window as TrackingWindow;
    if (gaReady && previousGaPath.current !== pathname) {
      trackingWindow.gtag?.("event", "page_view", { page_location: location.origin + pathname, page_title: document.title, page_referrer: previousGaPath.current ? location.origin + previousGaPath.current : "" });
      previousGaPath.current = pathname;
    }
    // A form-prefill query or fragment must not be collected by the pixel.
    if (pixelReady && previousPixelPath.current !== pathname && !location.search && !location.hash) {
      trackingWindow.fbq?.("track", "PageView");
      previousPixelPath.current = pathname;
    }
  }, [pathname, gaReady, pixelReady]);
  if (marketing.gtm || marketing.ga) { preconnect("https://www.googletagmanager.com"); prefetchDNS("https://www.googletagmanager.com"); }
  if (marketing.pixel) { preconnect("https://connect.facebook.net"); prefetchDNS("https://connect.facebook.net"); }
  return <>
    {marketing.gtm && <Script id="asir-gtm-bootstrap" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];window.dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});`}</Script>}
    {marketing.gtm && <Script id="asir-gtm" src={`https://www.googletagmanager.com/gtm.js?id=${marketing.gtm}`} strategy="afterInteractive" />}
    {marketing.ga && <Script id="asir-ga-config" strategy="afterInteractive" onReady={() => setGaReady(true)}>{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${marketing.ga}',{send_page_view:false,page_location:location.origin+location.pathname,page_referrer:'',allow_google_signals:false,allow_ad_personalization_signals:false});`}</Script>}
    {marketing.ga && <Script id="asir-ga" src={`https://www.googletagmanager.com/gtag/js?id=${marketing.ga}`} strategy="afterInteractive" />}
    {marketing.pixel && <Script id="asir-pixel-config" strategy="afterInteractive" onReady={() => setPixelReady(true)}>{`if(!window.fbq){var q=window.fbq=function(){q.callMethod?q.callMethod.apply(q,arguments):q.queue.push(arguments)};q.queue=[];q.push=q;q.loaded=true;q.version='2.0';}fbq('set','autoConfig',false,'${marketing.pixel}');fbq('init','${marketing.pixel}');fbq('consent','grant');`}</Script>}
    {marketing.pixel && <Script id="asir-pixel" src="https://connect.facebook.net/en_US/fbevents.js" strategy="afterInteractive" />}
  </>;
}
