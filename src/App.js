import React, { useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { buildHotelModel, findBestBooking, calculateTravelTime } from './bookingLogic';

export default function App() {
  const hotel = useMemo(() => buildHotelModel(), []);
  const initialMap = useMemo(() => {
    const m = {};
    for (const f of hotel) for (const r of f.rooms) m[r.number] = 'available';
    return m;
  }, [hotel]);

  const [roomMap, setRoomMap] = useState(initialMap);
  const [numToBook, setNumToBook] = useState(1);
  const [lastBooking, setLastBooking] = useState({ rooms: [], time: 0 });
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmRooms, setConfirmRooms] = useState([]);
  const historyRef = useRef([]); // for undo

  function resetAll() {
    setRoomMap({ ...initialMap });
    setLastBooking({ rooms: [], time: 0 });
    historyRef.current = [];
  }

  function randomOccupancy(p = 0.25) {
    setRoomMap(prev => {
      const map = { ...prev };
      const availableRooms = Object.keys(map).filter(k => map[k] === 'available');
      for (let i = availableRooms.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1)); [availableRooms[i], availableRooms[j]] = [availableRooms[j], availableRooms[i]];
      }
      const toOccupy = Math.floor(availableRooms.length * p);
      for (let i = 0; i < toOccupy; i++) map[availableRooms[i]] = 'occupied';
      historyRef.current.push({ type: 'random', changes: availableRooms.slice(0, toOccupy) });
      return map;
    });
  }

  function toggleRoom(num) {
    setRoomMap(prev => {
      const cur = prev[num]; if (cur === 'booked') return prev;
      const copy = { ...prev }; copy[num] = cur === 'available' ? 'occupied' : 'available';
      historyRef.current.push({ type: 'toggle', room: num });
      return copy;
    });
  }

  function prepareBooking() {
    try {
      const k = Number(numToBook);
      if (k < 1 || k > 5) return alert('Select 1 to 5 rooms');
      const res = findBestBooking(roomMap, k);
      if (!res.rooms || res.rooms.length === 0) return alert('Unable to find suitable rooms for booking');
      setConfirmRooms(res.rooms.sort((a,b)=>a-b));
      setShowConfirm(true);
    } catch (e) { alert(e.message); }
  }

  function confirmBooking() {
    setRoomMap(prev => { const p = { ...prev }; for (const r of confirmRooms) p[r] = 'booked'; return p; });
    historyRef.current.push({ type: 'booking', rooms: confirmRooms });
    const time = calculateTravelTime(confirmRooms);
    setLastBooking({ rooms: confirmRooms.slice(), time });
    setShowConfirm(false);
    setConfirmRooms([]);
  }

  function exportBooking() {
    const booked = Object.keys(roomMap).filter(k => roomMap[k] === 'booked').map(Number);
    const payload = { booked, timestamp: new Date().toISOString(), travelTime: calculateTravelTime(booked) };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'booking.json'; a.click(); URL.revokeObjectURL(url);
  }

  function undo() {
    const last = historyRef.current.pop();
    if (!last) return alert('Nothing to undo');
    if (last.type === 'random') {
      setRoomMap(prev => { const p = { ...prev }; for (const r of last.changes) p[r] = 'available'; return p; });
    } else if (last.type === 'booking') {
      setRoomMap(prev => { const p = { ...prev }; for (const r of last.rooms) p[r] = 'available'; return p; });
      setLastBooking({ rooms: [], time: 0 });
    } else if (last.type === 'toggle') {
      setRoomMap(prev => { const p = { ...prev }; p[last.room] = p[last.room] === 'available' ? 'occupied' : 'available'; return p; });
    }
  }

  const totals = useMemo(() => {
    const t = Object.keys(roomMap).length;
    const booked = Object.values(roomMap).filter(v => v === 'booked').length;
    const occupied = Object.values(roomMap).filter(v => v === 'occupied').length;
    return { t, booked, occupied, available: t - booked - occupied };
  }, [roomMap]);

  return (
    <div className="app">
      <header className="topbar">
        <div className="title">Hotel Room Reservation</div>
        
      </header>

      <div className="controls">
        <div className="control-row">
          <label className="label">No of Rooms</label>
          <input className="num-input" type="number" min="1" max="5" value={numToBook} onChange={e=>setNumToBook(e.target.value)} />
          <button className="btn primary" onClick={prepareBooking}>Book</button>
          <button className="btn" onClick={resetAll}>Reset</button>
          <button className="btn" onClick={()=>randomOccupancy(0.25)}>Random</button>
        </div>
        <div className="stats">Rooms: {totals.t} • Available: {totals.available} • Booked: {totals.booked} • Occupied: {totals.occupied}</div>
      </div>

      <main className="layout">
        <section className="building">
          {hotel.slice().reverse().map(f => (
            <div key={f.floor} className="floor-row">
              <div className="lift-col">
                {f.floor === 10 ? <div className="lift-box top">Lift</div> : <div className="lift-box">Lift</div>}
              </div>
              <div className="rooms-col" role="list" aria-label={`Floor ${f.floor} rooms`}>
                {f.rooms.map(r => {
                  const state = roomMap[r.number];
                  return (
                    <motion.button
                      role="button"
                      key={r.number}
                      className={`room ${state}`}
                      onClick={() => toggleRoom(r.number)}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.98 }}
                      aria-pressed={state === 'occupied'}
                      aria-label={`Room ${r.number} ${state}`}
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleRoom(r.number); } }}
                    >
                      <div className="room-num">{r.number}</div>
                      <div className="room-state">{state}</div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        <aside className="panel">
          <div className="panel-card">
            <h3>Last booking</h3>
            <div className="last">{lastBooking.rooms.length ? `${lastBooking.rooms.join(', ')} (travel time ${lastBooking.time} mins)` : 'None'}</div>
            <div className="panel-actions">
              <button className="btn small" onClick={exportBooking}>Export JSON</button>
              <button className="btn small" onClick={undo}>Undo</button>
            </div>
            <h4>Legend</h4>
            <ul className="legend">
              <li><span className="sw available" /> Available</li>
              <li><span className="sw booked" /> Booked</li>
              <li><span className="sw occupied" /> Occupied</li>
            </ul>

            <h4>Notes</h4>
            <ol>
              <li>Max 5 rooms per booking enforced.</li>
              <li>Priority: same-floor contiguous rooms.</li>
              <li>Else: minimize combined vertical + horizontal travel time.</li>
            </ol>
          </div>
        </aside>
      </main>

      <AnimatePresence>
        {showConfirm && (
          <motion.div className="modal-overlay" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            <motion.div className="modal" initial={{ scale:0.9, y:20 }} animate={{ scale:1, y:0 }} exit={{ scale:0.9, y:20 }}>
              <h3>Confirm Booking</h3>
              <p>Rooms to be booked: <strong>{confirmRooms.join(', ')}</strong></p>
              <p>Estimated travel time: <strong>{calculateTravelTime(confirmRooms)} mins</strong></p>
              <div className="modal-actions">
                <button className="btn" onClick={()=>{setShowConfirm(false); setConfirmRooms([]);}}>Cancel</button>
                <button className="btn primary" onClick={confirmBooking}>Confirm</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

     
    </div>
  );
}