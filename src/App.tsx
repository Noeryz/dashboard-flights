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
import { MethodologyPanel } from './components/dashboard/MethodologyPanel';
import type { ActiveMenu } from './types/flight';

export default function App() {
  const baseUrl = import.meta.env.BASE_URL;
  const [viewState, setViewState] = useState<'HERO' | 'TRANSITION' | 'DASHBOARD'>('HERO');
  const transitionVideoRef = useRef<HTMLVideoElement>(null);

  const { setRawRows, setAirportCoords, activeMenu, setActiveMenu, viewMode } = useFlightStore();

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

  const handleStartTransition = (targetMenu: ActiveMenu = 'OVERVIEW') => {
    setActiveMenu(targetMenu);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
            src={`${baseUrl}videos/transition.mp4`}
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
            ✈ Menyiapkan ringkasan kinerja penerbangan
          </div>
        </div>
      )}

      {viewState === 'DASHBOARD' && (
        <div className="min-h-screen relative bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
          {/* Latar Belakang Gambar Pesawat */}
          <div className="fixed inset-0 z-0 pointer-events-none">
            <img
              src={`${baseUrl}images/bg-plane.png`}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover opacity-75"
            />
            <div className="absolute inset-0 bg-slate-950/35 backdrop-brightness-90" />
          </div>

          <div className="relative z-10 flex flex-col min-h-screen">
            <Navbar onReturnHero={handleReturnHero} />

            <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col pb-12 md:flex-row">
              <Sidebar />

              <main className="min-w-0 flex-1 space-y-6 overflow-x-hidden p-6">
                <div className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/50 px-4 py-2 text-xs backdrop-blur-md">
                  <span className="text-slate-300">
                    Mode tampilan:{' '}
                    <strong className={viewMode === 'analyst' ? 'text-violet-400' : 'text-cyan-400'}>
                      {viewMode === 'analyst' ? 'Analis · data granular' : 'Publik · ringkasan'}
                    </strong>
                  </span>
                </div>

                {activeMenu === 'OVERVIEW' && <OverviewPanel />}
                {activeMenu === 'INSIGHTS' && <ExecutiveInsightsPanel />}
                {activeMenu === 'AIRLINE' && <CarrierPanel />}
                {activeMenu === 'AIRPORT' && <AirportPanel />}
                {activeMenu === 'FACTORS' && <FactorsPanel />}
                {activeMenu === 'ROUTE' && <RoutePanel />}
                {activeMenu === 'METHODOLOGY' && <MethodologyPanel />}

                {viewMode === 'analyst' && <AnalystDataTable />}
              </main>
            </div>

            <footer className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between border-t border-slate-800/80 bg-slate-950/90 px-6 py-2 font-mono text-[10px] text-slate-300 backdrop-blur-xl">
              <div className="flex items-center gap-2 text-cyan-400">
                <span>ANALISIS PENERBANGAN</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-300">DATASET ANALISIS BTS / T-100</span>
              </div>
              <div className="hidden text-slate-400 sm:block">
                Standar Estimasi Biaya FAA APO-100
              </div>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}