import { useEffect, useState, useRef } from 'react';
import { useFlightStore } from './store/useFlightStore';
import { loadAllFlightData } from './utils/dataLoader';
import { LandingHero } from './components/cinematic/LandingHero';
import { Navbar } from './components/navigation/Navbar';
import { Sidebar } from './components/navigation/Sidebar';
import { OverviewPanel } from './components/dashboard/OverviewPanel';
import { ExecutiveInsightsPanel } from './components/dashboard/ExecutiveInsightsPanel';
import { CarrierPanel } from './components/dashboard/CarrierPanel';
import { AirportPanel } from './components/dashboard/AirportPanel';
import { FactorsPanel } from './components/dashboard/FactorsPanel';
import { RoutePanel } from './components/dashboard/RoutePanel';
import { AnalystDataTable } from './components/dashboard/AnalystDataTable';
import { RelationshipsPanel } from './components/dashboard/RelationshipsPanel';
import { MethodologyPanel } from './components/dashboard/MethodologyPanel';

export default function App() {
  const [viewState, setViewState] = useState<'HERO' | 'TRANSITION' | 'DASHBOARD'>('HERO');
  const transitionVideoRef = useRef<HTMLVideoElement>(null);

  const { setRawRows, setAirportCoords, activeMenu, setActiveMenu, setFilter, viewMode } =
    useFlightStore();

  useEffect(() => {
    loadAllFlightData()
      .then(({ rows, coords }) => {
        if (rows && rows.length > 0) {
          setRawRows(rows);
        }
        if (coords) {
          setAirportCoords(coords);
        }
      })
      .catch((err) => {
        console.warn('Gagal memuat dataset:', err);
      });
  }, [setRawRows, setAirportCoords]);

  // BERPINDAH KE RINGKASAN UTAMA (OVERVIEW) SECARA DEFAULT
  const handleStartTransition = (targetMenuOrOrigin?: string, dest?: string) => {
    if (targetMenuOrOrigin === 'ROUTE' || targetMenuOrOrigin === 'route') {
      setActiveMenu('ROUTE');
    } else {
      setActiveMenu('OVERVIEW');
    }

    if (targetMenuOrOrigin && targetMenuOrOrigin !== 'ROUTE' && targetMenuOrOrigin !== 'OVERVIEW' && targetMenuOrOrigin !== 'overview') {
      setFilter('origin', targetMenuOrOrigin);
    }
    if (dest) {
      setFilter('destination', dest);
    }

    setViewState('TRANSITION');
  };

  const handleTransitionEnd = () => {
    window.scrollTo(0, 0);
    setViewState('DASHBOARD');
  };

  useEffect(() => {
    if (viewState === 'TRANSITION') {
      const video = transitionVideoRef.current;
      let timer: ReturnType<typeof setTimeout>;

      if (video) {
        video.currentTime = 0;
        video.play().catch((err) => {
          console.warn('Autoplay diblokir browser, langsung ke dashboard:', err);
          handleTransitionEnd();
        });

        timer = setTimeout(() => {
          handleTransitionEnd();
        }, 5000);
      } else {
        handleTransitionEnd();
      }

      return () => {
        if (timer) clearTimeout(timer);
      };
    }
  }, [viewState]);

  const handleReturnHero = () => {
    setViewState('HERO');
  };

  return (
    <>
      {viewState === 'HERO' && (
        <LandingHero onStartTransition={handleStartTransition} />
      )}

      {viewState === 'TRANSITION' && (
        <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden pointer-events-none">
          <video
            ref={transitionVideoRef}
            src="/videos/transition.mp4"
            autoPlay
            muted
            playsInline
            disablePictureInPicture
            disableRemotePlayback
            controlsList="nodownload nofullscreen noremoteplayback"
            onEnded={handleTransitionEnd}
            onError={handleTransitionEnd}
            className="w-full h-full object-cover pointer-events-none"
          />
          {/* TEKS BADGE TRANSISI DIPERBARUI */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-full bg-slate-950/85 border border-cyan-500/40 text-cyan-400 font-mono text-xs backdrop-blur-md shadow-[0_0_25px_rgba(6,182,212,0.5)] tracking-wider uppercase flex items-center gap-3 pointer-events-none">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            ✈ Semoga perjalanan anda menyenangkan
          </div>
        </div>
      )}

      {viewState === 'DASHBOARD' && (
        <div className="min-h-screen relative bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
          {/* Latar Belakang Gambar Pesawat */}
          <div className="fixed inset-0 z-0 pointer-events-none">
            <img
              src="/images/bg-plane.png"
              alt="Latar Belakang Pesawat"
              className="w-full h-full object-cover opacity-75"
            />
            <div className="absolute inset-0 bg-slate-950/35 backdrop-brightness-90" />
          </div>

          <div className="relative z-10 flex flex-col min-h-screen">
            <Navbar onReturnHero={handleReturnHero} />

            <div className="flex-1 flex flex-col lg:flex-row w-full max-w-7xl mx-auto pb-12">
              <Sidebar />

              <main className="flex-1 p-6 space-y-6 overflow-x-hidden">
                <div className="px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between text-xs backdrop-blur-md">
                  <span className="text-slate-300">
                    Mode Tampilan:{' '}
                    <strong className={viewMode === 'analyst' ? 'text-violet-400' : 'text-cyan-400'}>
                      {viewMode === 'analyst'
                        ? 'Mode Analis (Detail Data Granular BTS T-100)'
                        : 'Mode Eksekutif & Publik (Ringkasan Penumpang)'}
                    </strong>
                  </span>
                </div>

                {activeMenu === 'OVERVIEW' && <OverviewPanel />}
                {activeMenu === 'INSIGHTS' && <ExecutiveInsightsPanel />}
                {activeMenu === 'AIRLINE' && <CarrierPanel />}
                {activeMenu === 'AIRPORT' && <AirportPanel />}
                {activeMenu === 'FACTORS' && <FactorsPanel />}
                {activeMenu === 'ROUTE' && <RoutePanel />}
                {activeMenu === 'RELATIONSHIPS' && <RelationshipsPanel />}
                {activeMenu === 'METHODOLOGY' && <MethodologyPanel />}

                {viewMode === 'analyst' && <AnalystDataTable />}
              </main>
            </div>

            <footer className="fixed bottom-0 inset-x-0 z-50 bg-slate-950/90 border-t border-slate-800/80 px-6 py-2 flex items-center justify-between text-[10px] font-mono text-slate-300 backdrop-blur-xl">
              <div className="flex items-center gap-2 text-cyan-400">
                <span>ANALISIS PENERBANGAN</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-300">DATASET ANALISIS BTS / T-100</span>
              </div>
              <div className="hidden sm:block text-slate-400">
                Standar Estimasi Biaya FAA APO-100
              </div>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}