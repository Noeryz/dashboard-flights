import React, { useEffect, useRef, useMemo } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useFlightStore } from '../../store/useFlightStore';
import { getDelayDurationObservation } from '../../utils/flightAnalytics';
import { Plane, ArrowRight, Sparkles, Activity, Clock, AlertTriangle, Percent, ArrowDown, Compass, BarChart3 } from 'lucide-react';
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

      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-slate-950/50 pointer-events-none z-10" />

      {/* HEADER NAVIGASI */}
      <header className="absolute top-0 left-0 right-0 z-40 max-w-7xl mx-auto px-6 py-5 flex items-center justify-between backdrop-blur-md bg-slate-950/20 border-b border-slate-800/30">
        <button
          type="button"
          onClick={handleReturnToTop}
          aria-label="Kembali ke awal halaman"
          className="flex items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-2 text-cyan-300">
            <Plane className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              Flight<span className="text-cyan-300">Insight</span>
            </h1>
            <p className="text-[9px] text-slate-400 tracking-widest uppercase">Analisis Data Penerbangan BTS</p>
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
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-2 text-xs font-bold text-slate-950 transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]"
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/40 border border-cyan-500/30 text-cyan-400 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" /> FLIGHTINSIGHT • LAPORAN ANALISIS PENERBANGAN
          </div>

          <h2 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            Analisis Kinerja <br />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-400 bg-clip-text text-transparent">
              Penerbangan Berbasis Data
            </span>
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Laporan deskriptif dan korelasi ini memperlihatkan pola volume, keterlambatan, serta kapasitas pada data BTS/T-100.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleScrollDownClick}
              className="px-5 py-3 rounded-xl bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 font-bold text-xs flex items-center gap-2 hover:bg-cyan-500/25 backdrop-blur-md transition-all cursor-pointer"
            >
              Lihat Ringkasan Analisis <ArrowDown className="w-4 h-4 animate-bounce" />
            </button>

            <button
              onClick={(event) => handleStartDashboard('OVERVIEW', event)}
              className="px-5 py-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-slate-300 font-semibold text-xs flex items-center gap-2 hover:text-white hover:border-slate-700 backdrop-blur-md transition-all cursor-pointer"
            >
              Buka Dasbor Kinerja <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800/40 pt-3">
          <div className="flex items-center gap-2 text-cyan-400">
            <span>01 / PENDEKATAN LANDASAN</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">↓ Gulir untuk melihat ringkasan data</span>
          </div>
          <div>0% · DIKENDALIKAN SCROLL</div>
        </div>
      </div>

      {/* SECTION 2: OVERVIEW UTAMA & 6 KPI NASIONAL 2024-2025 */}
      <div
        ref={overviewRef}
        className="absolute inset-0 z-30 flex flex-col justify-between p-6 pt-24 max-w-7xl mx-auto pointer-events-none opacity-0"
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] font-mono text-cyan-400 tracking-widest uppercase">
              RINGKASAN DATA PENERBANGAN • PERIODE 2024–2025
            </p>
            <h3 className="text-3xl font-extrabold text-white mt-1">Kinerja penerbangan dalam angka.</h3>
            <p className="text-xs text-slate-400">Ringkasan agregat untuk membaca skala dan pola operasi.</p>
          </div>
        </div>

        <div className="my-auto grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          
          {/* KPI KIRI (AKUMULASI NASIONAL) - OPASITAS DISESUAIKAN SAMA DASHBOARD */}
          <div className="md:col-span-3 space-y-3">
            <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/60 backdrop-blur-md shadow-lg">
              <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between">
                <span>Keberangkatan</span>
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
              </p>
              <p className="text-2xl font-black text-white mt-1">
                {globalStats.flightsArrival}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/60 backdrop-blur-md shadow-lg">
              <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between">
                <span>Pembatalan</span>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              </p>
              <p className="text-2xl font-black text-amber-400 mt-1">
                {globalStats.canceledFlights}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/60 backdrop-blur-md shadow-lg">
              <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between">
                <span>Pengalihan Penerbangan</span>
                <Percent className="w-3.5 h-3.5 text-violet-400" />
              </p>
              <p className="text-2xl font-black text-violet-400 mt-1">
                {globalStats.divertedFlights}
              </p>
            </div>
          </div>

          {/* KARTU TENGAH (RINGKASAN UTAMA) - OPASITAS DISESUAIKAN SAMA DASHBOARD */}
          <div className="md:col-span-6">
            <div className="p-6 rounded-3xl bg-slate-950/50 border border-slate-800/70 shadow-[0_0_40px_rgba(6,182,212,0.2)] backdrop-blur-md space-y-5 text-center pointer-events-auto">
              <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                <Compass className="w-8 h-8 animate-spin-slow" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black tracking-tight text-white font-sans">
                  Ringkasan Kinerja Penerbangan
                </h3>
                <p className="text-slate-300 text-xs font-sans leading-relaxed max-w-md mx-auto">
                  Data agregat menunjukkan skala penerbangan, keterlambatan, pembatalan, dan pengalihan. Panel analisis membandingkan pola tersebut menurut bulan, maskapai, bandara, dan rute.
                </p>
              </div>

              <button
                type="button"
                onClick={(event) => handleStartDashboard('OVERVIEW', event)}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-slate-950 font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all cursor-pointer hover:scale-[1.01]"
              >
                <BarChart3 className="w-4 h-4" /> Buka Ringkasan Utama <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* KPI KANAN (AKUMULASI NASIONAL) - OPASITAS DISESUAIKAN SAMA DASHBOARD */}
          <div className="md:col-span-3 space-y-3">
            <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/60 backdrop-blur-md shadow-lg">
              <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between">
                <span>Rata-Rata Durasi Delay</span>
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
              </p>
              <p className="text-2xl font-black text-cyan-400 mt-1">
                {globalStats.avgDelay}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/60 backdrop-blur-md shadow-lg">
              <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between">
                <span>Tingkat Keterlambatan</span>
                <Percent className="w-3.5 h-3.5 text-violet-400" />
              </p>
              <p className="text-2xl font-black text-violet-400 mt-1">
                {globalStats.delayRate}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/60 backdrop-blur-md shadow-lg">
              <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between">
                <span>Kode Carrier Terdata</span>
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
              </p>
              <p className="text-2xl font-black text-emerald-400 mt-1">
                {globalStats.carriersServed}
              </p>
            </div>
          </div>

        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800/40 pt-3">
          <div className="flex items-center gap-2 text-cyan-400">
            <span>02 / RINGKASAN DATA</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">BUKA DASBOR UNTUK MELIHAT PERBANDINGAN TERPERINCI</span>
          </div>
          <div>100% · DIKENDALIKAN SCROLL</div>
        </div>
      </div>
    </div>
  );
};