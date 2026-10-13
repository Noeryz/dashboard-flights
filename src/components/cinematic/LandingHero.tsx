import React, { useEffect, useRef, useMemo } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useFlightStore } from '../../store/useFlightStore';
import { getDelayDurationObservation } from '../../utils/flightAnalytics';
import { Plane, ArrowRight, Activity, Clock, AlertTriangle, Percent, ArrowDown, Compass, BarChart3 } from 'lucide-react';
import type { ActiveMenu } from '../../types/flight';

gsap.registerPlugin(ScrollTrigger);

interface LandingHeroProps {
  onStartTransition: (targetMenu?: ActiveMenu) => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onStartTransition }) => {
  const baseUrl = import.meta.env.BASE_URL;
  const { rawRows } = useFlightStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const initialHeroRef = useRef<HTMLDivElement>(null);
  const overviewRef = useRef<HTMLDivElement>(null);

  // HITUNG TOTAL DATASET NASIONAL 2024–2025 OVERALL
  const globalStats = useMemo(() => {
    let totalFlights = 0;
    let totalCancelled = 0;
    let totalDiverted = 0;
    let delayedFlightsCount = 0;
    let observedDelayMinutes = 0;
    let observedDelayedFlights = 0;
    const carriersSet = new Set<string>();

    if (rawRows && rawRows.length > 0) {
      rawRows.forEach((r) => {
        const flights = Number(r.DEPARTURES_PERFORMED || 0);
        const cancelled = Number(r.CANCELLED_FLIGHTS || 0);
        const diverted = Number(r.DIVERTED_FLIGHTS || 0);
        const delayedFlights = Number(r.ARR_DELAY_FLIGHTS || 0);
        const carrier = r.UNIQUE_CARRIER.trim();

        totalFlights += flights;
        totalCancelled += cancelled;
        totalDiverted += diverted;

        delayedFlightsCount += delayedFlights;
        const durationObservation = getDelayDurationObservation(r);
        observedDelayMinutes += durationObservation.delayMinutes;
        observedDelayedFlights += durationObservation.delayedFlights;

        if (carrier) carriersSet.add(carrier);
      });
    }

    const avgDelay = observedDelayedFlights > 0
      ? `${(observedDelayMinutes / observedDelayedFlights).toFixed(2)} mnt`
      : 'Tidak tersedia';
    const delayRate = totalFlights > 0
      ? `${((delayedFlightsCount / totalFlights) * 100).toFixed(2)}%`
      : 'Tidak tersedia';

    const formatCompact = (num: number): string => {
      if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
      if (num >= 1_000) return (num / 1_000).toFixed(2) + 'K';
      return num.toLocaleString('id-ID');
    };

    return {
      flightsArrival: formatCompact(totalFlights),
      canceledFlights: formatCompact(totalCancelled),
      divertedFlights: formatCompact(totalDiverted),
      avgDelay,
      delayRate,
      carriersServed: carriersSet.size.toLocaleString('id-ID')
    };
  }, [rawRows]);

  // ANIMASI GULIR (SCROLL SCRUB) VIDEO
  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;

    if (!video || !container) return;

    video.controls = false;

    const setupScrollScrub = () => {
      const videoDuration = video.duration || 4;
      const videoProxy = { currentTime: 0 };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: '+=300%',
          scrub: 0.5,
          pin: true,
          anticipatePin: 1,
        },
      });

      tl.to(
        videoProxy,
        {
          currentTime: videoDuration,
          ease: 'none',
          onUpdate: () => {
            if (video && !isNaN(video.duration)) {
              video.currentTime = videoProxy.currentTime;
            }
          },
        },
        0
      );

      if (initialHeroRef.current) {
        tl.to(
          initialHeroRef.current,
          { opacity: 0, y: -40, pointerEvents: 'none', duration: 0.25 },
          0
        );
      }

      if (overviewRef.current) {
        tl.fromTo(
          overviewRef.current,
          { opacity: 0, y: 50, pointerEvents: 'none' },
          { opacity: 1, y: 0, pointerEvents: 'auto', duration: 0.4 },
          0.5
        );
      }
    };

    if (video.readyState >= 1) {
      setupScrollScrub();
    } else {
      video.addEventListener('loadedmetadata', setupScrollScrub);
    }

    return () => {
      video.removeEventListener('loadedmetadata', setupScrollScrub);
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  const handleStartDashboard = (targetMenu: ActiveMenu = 'OVERVIEW', e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    ScrollTrigger.getAll().forEach((t) => t.kill());
    onStartTransition(targetMenu);
  };

  const handleReturnToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollDownClick = () => {
    window.scrollTo({
      top: window.innerHeight * 2,
      behavior: 'smooth',
    });
  };

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-slate-950 text-white overflow-hidden">
      <video
        ref={videoRef}
        src={`${baseUrl}videos/start.mp4`}
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
      />

      <div className="absolute inset-0 bg-slate-950/35 pointer-events-none z-10" />

      {/* HEADER NAVIGASI */}
      <header className="absolute top-0 left-0 right-0 z-40 max-w-7xl mx-auto px-6 py-5 flex items-center justify-between bg-slate-950/35 border-b border-slate-800/50">
        <button
          type="button"
          onClick={handleReturnToTop}
          aria-label="Kembali ke awal halaman"
          className="flex items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          <span aria-hidden="true" className="relative h-10 w-10 shrink-0">
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt=""
              className="absolute left-1/2 top-1/2 h-14 w-14 max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
            />
          </span>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              Flight<span className="text-cyan-300">Insight</span>
            </h1>
            <p className="text-[10px] text-slate-400">Analisis data penerbangan BTS</p>
          </div>
        </button>

        <nav aria-label="Navigasi halaman" className="hidden items-center gap-6 text-xs font-medium text-slate-300 md:flex">
          <button type="button" onClick={handleReturnToTop} className="border-b border-cyan-300 pb-1 font-semibold text-cyan-200">Beranda</button>
          <button type="button" onClick={(event) => handleStartDashboard('OVERVIEW', event)} className="transition-colors hover:text-white">Dashboard</button>
          <button type="button" onClick={(event) => handleStartDashboard('METHODOLOGY', event)} className="transition-colors hover:text-white">Data & metodologi</button>
        </nav>

        <button
          type="button"
          onClick={(event) => handleStartDashboard('OVERVIEW', event)}
          className="flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-cyan-300"
        >
          Buka dashboard <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* SECTION 1: HERO AWAL */}
      <div
        ref={initialHeroRef}
        className="absolute inset-0 z-30 flex flex-col justify-between p-6 pt-24 max-w-7xl mx-auto pointer-events-auto"
      >
        <div className="my-auto max-w-2xl space-y-5">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-200">
            <Plane className="w-4 h-4 text-cyan-300" /> FlightInsight · Analisis penerbangan
          </div>

          <h2 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight">
            Analisis Kinerja <br />
            <span className="text-cyan-300">
              Penerbangan Berbasis Data
            </span>
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Ringkasan data BTS/T-100 tentang volume penerbangan, keterlambatan, dan kapasitas.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleScrollDownClick}
              className="px-5 py-3 rounded-lg bg-cyan-400 text-slate-950 font-semibold text-sm flex items-center gap-2 hover:bg-cyan-300 transition-colors cursor-pointer"
            >
              Lihat ringkasan <ArrowDown className="w-4 h-4" />
            </button>

            <button
              onClick={(event) => handleStartDashboard('OVERVIEW', event)}
              className="px-5 py-3 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-200 font-medium text-sm flex items-center gap-2 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Buka dashboard <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-700/70 pt-3">
          <div className="flex items-center gap-2 text-cyan-400">
            <span>FlightInsight</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">Gulir untuk ringkasan</span>
          </div>
          <div>Data BTS/T-100</div>
        </div>
      </div>

      {/* SECTION 2: OVERVIEW UTAMA & 6 KPI NASIONAL 2024-2025 */}
      <div
        ref={overviewRef}
        className="absolute inset-0 z-30 flex flex-col justify-between p-6 pt-24 max-w-7xl mx-auto pointer-events-none opacity-0"
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-cyan-300">
              Analisis Jaringan Operasi Penerbangan 2024 - 2025
            </p>
            <h3 className="mt-1 text-3xl font-extrabold text-white">
              Skala dan Ketepatan Waktu Penerbangan
              <span className="block">Domestik United States</span>
            </h3>
            <p className="text-xs text-slate-400">Menganalisis Volume Penerbangan dan Ketepatan Waktu</p>
          </div>
        </div>

        <div className="my-auto grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          
          {/* KPI KIRI (AKUMULASI NASIONAL) - OPASITAS DISESUAIKAN SAMA DASHBOARD */}
          <div className="md:col-span-3 space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-950/75 border border-slate-700/70">
              <p className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                <span>Keberangkatan</span>
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
              </p>
              <p className="text-2xl font-bold text-white mt-1">
                {globalStats.flightsArrival}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/75 border border-slate-700/70">
              <p className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                <span>Pembatalan</span>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              </p>
              <p className="text-2xl font-bold text-amber-400 mt-1">
                {globalStats.canceledFlights}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/75 border border-slate-700/70">
              <p className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                <span>Pengalihan Penerbangan</span>
                <Percent className="w-3.5 h-3.5 text-violet-400" />
              </p>
              <p className="text-2xl font-bold text-violet-400 mt-1">
                {globalStats.divertedFlights}
              </p>
            </div>
          </div>

          {/* KARTU TENGAH (RINGKASAN UTAMA) - OPASITAS DISESUAIKAN SAMA DASHBOARD */}
          <div className="md:col-span-6">
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-700/80 shadow-lg space-y-5 text-center pointer-events-auto">
              <div className="inline-flex p-3 rounded-xl bg-slate-800 text-cyan-300">
                <Compass className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-semibold tracking-tight text-white">
                  Ringkasan Kinerja Penerbangan
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed max-w-md mx-auto">
                  Ringkasan volume, keterlambatan, pembatalan, dan pengalihan penerbangan.
                </p>
              </div>

              <button
                type="button"
                onClick={(event) => handleStartDashboard('OVERVIEW', event)}
                className="w-full py-3.5 px-6 rounded-lg bg-cyan-400 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-cyan-300 transition-colors cursor-pointer"
              >
                <BarChart3 className="w-4 h-4" /> Buka ringkasan utama <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* KPI KANAN (AKUMULASI NASIONAL) - OPASITAS DISESUAIKAN SAMA DASHBOARD */}
          <div className="md:col-span-3 space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-950/75 border border-slate-700/70">
              <p className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                <span>Rata-rata durasi delay</span>
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
              </p>
              <p className="text-2xl font-bold text-cyan-300 mt-1">
                {globalStats.avgDelay}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/75 border border-slate-700/70">
              <p className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                <span>Tingkat keterlambatan</span>
                <Percent className="w-3.5 h-3.5 text-violet-400" />
              </p>
              <p className="text-2xl font-bold text-violet-300 mt-1">
                {globalStats.delayRate}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/75 border border-slate-700/70">
              <p className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                <span>Kode carrier</span>
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
              </p>
              <p className="text-2xl font-bold text-emerald-300 mt-1">
                {globalStats.carriersServed}
              </p>
            </div>
          </div>

        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/40 pt-3">
          <div className="flex items-center gap-2 text-cyan-400">
            <span>Ringkasan data</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">Buka dashboard untuk perbandingan</span>
          </div>
          <div>Data BTS/T-100</div>
        </div>
      </div>
    </div>
  );
};