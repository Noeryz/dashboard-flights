import React, { useState } from 'react';
import { useFlightStore } from '../../store/useFlightStore';
import { Search, Database, ChevronLeft, ChevronRight } from 'lucide-react';
import { InsightCard } from './InsightCard';

export const AnalystDataTable: React.FC = () => {
  const { getFilteredRows } = useFlightStore();
  const filteredRows = getFilteredRows();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const searchedRows = filteredRows.filter((row) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const carrier = row.UNIQUE_CARRIER.toLowerCase();
    const origin = row.ORIGIN.toLowerCase();
    const dest = row.DEST.toLowerCase();
    return carrier.includes(term) || origin.includes(term) || dest.includes(term);
  });

  const totalPages = Math.max(1, Math.ceil(searchedRows.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageData = searchedRows.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="p-6 rounded-3xl cockpit-card-normal space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4 text-violet-400" /> Tabel Rekapitulasi Data Granular FAA (Mode Analis)
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Menampilkan data penerbangan terpadu langsung dari dataset BTS T-100
          </p>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari maskapai / bandara..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs font-mono text-violet-300 focus:outline-none focus:border-violet-400 placeholder:text-slate-600"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-950/60">
              <th className="p-3">Tahun/Bulan</th>
              <th className="p-3">Maskapai</th>
              <th className="p-3">Asal</th>
              <th className="p-3">Tujuan</th>
              <th className="p-3">Passengers</th>
              <th className="p-3">Flight Volume</th>
              <th className="p-3">Penerbangan Terlambat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {pageData.length > 0 ? (
              pageData.map((row, idx) => {
                const year = row.YEAR;
                const month = row.MONTH;
                const carrier = row.UNIQUE_CARRIER;
                const origin = row.ORIGIN;
                const dest = row.DEST;
                const passengers = row.PASSENGERS;
                const flights = row.DEPARTURES_PERFORMED;
                const delayedFlights = Number(row.ARR_DELAY_FLIGHTS) || 0;
                const delayRate = Number(flights) > 0 ? (delayedFlights / Number(flights)) * 100 : 0;

                return (
                  <tr key={idx} className="hover:bg-violet-500/10 transition-colors">
                    <td className="p-3 text-slate-300">{year} / M{month}</td>
                    <td className="p-3 font-bold text-violet-400">{carrier}</td>
                    <td className="p-3 text-cyan-400">{origin}</td>
                    <td className="p-3 text-cyan-300">{dest}</td>
                    <td className="p-3 text-slate-200">{Number(passengers).toLocaleString('id-ID')}</td>
                    <td className="p-3 text-slate-200">{Number(flights).toLocaleString('id-ID')}</td>
                    <td className="p-3">
                      <span className="text-slate-200">{delayedFlights.toLocaleString('id-ID')} ({delayRate.toFixed(1)}%)</span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-500 italic">
                  Tidak ada data yang sesuai dengan kriteria pencarian.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-[11px] font-mono text-slate-400">
        <span>
          Halaman <strong className="text-violet-400">{currentPage}</strong> dari {totalPages} ({searchedRows.length} total baris)
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 disabled:opacity-40 hover:border-violet-400 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-violet-300" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 disabled:opacity-40 hover:border-violet-400 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 text-violet-300" />
          </button>
        </div>
        <InsightCard title="Unit analisis dan interpretasi tabel">
          Satu baris adalah agregat bulanan maskapai–rute, bukan satu penerbangan individual. “Penerbangan
          terlambat” menunjukkan jumlah agregat yang memiliki keterlambatan kedatangan; angka penumpang dan
          volume juga merupakan total pada baris tersebut. Karena itu, tabel tidak menyediakan label on-time
          individual dan tidak dapat dipakai untuk menilai penerbangan tertentu.
        </InsightCard>
      </div>
    </div>
  );
};