// Contains pure booking logic so it can be unit tested

export function buildHotelModel() {
  const floors = [];
  for (let f = 1; f <= 9; f++) {
    const rooms = [];
    for (let i = 1; i <= 10; i++) rooms.push({ number: f * 100 + i, index: i - 1, floor: f });
    floors.push({ floor: f, rooms });
  }
  const topRooms = [];
  for (let i = 1; i <= 7; i++) topRooms.push({ number: 1000 + i, index: i - 1, floor: 10 });
  floors.push({ floor: 10, rooms: topRooms });
  return floors;
}

export function floorIndex(roomNumber) {
  if (roomNumber >= 1001) return 10;
  return Math.floor(roomNumber / 100);
}
export function idxOnFloor(roomNumber) {
  if (roomNumber >= 1001) return roomNumber - 1001;
  return (roomNumber % 100) - 1;
}

export function calculateTravelTime(rooms) {
  if (!rooms || rooms.length <= 1) return 0;
  const byFloor = {};
  let minFloor = Infinity, maxFloor = -Infinity;
  for (const r of rooms) {
    const f = floorIndex(r);
    minFloor = Math.min(minFloor, f);
    maxFloor = Math.max(maxFloor, f);
    const idx = idxOnFloor(r);
    if (!byFloor[f]) byFloor[f] = [];
    byFloor[f].push(idx);
  }
  let vertical = (maxFloor - minFloor) * 2;
  let horizontal = 0;
  for (const f in byFloor) {
    const arr = byFloor[f];
    horizontal += Math.max(...arr) - Math.min(...arr);
  }
  return vertical + horizontal;
}

function bestOnFloor(sortedIndices, c) {
  if (sortedIndices.length < c) return null;
  let bestSpan = Infinity, bestSlice = null;
  for (let i = 0; i + c - 1 < sortedIndices.length; i++) {
    const slice = sortedIndices.slice(i, i + c);
    const span = slice[slice.length - 1] - slice[0];
    if (span < bestSpan) { bestSpan = span; bestSlice = slice; }
  }
  return { slice: bestSlice, span: bestSpan };
}

function compositions(k, n, maxPerFloor) {
  const results = [];
  const comp = Array(n).fill(0);
  function dfs(pos, remaining) {
    if (pos === n) { if (remaining === 0) results.push([...comp]); return; }
    const maxTake = Math.min(maxPerFloor[pos], remaining);
    for (let take = 0; take <= maxTake; take++) { comp[pos] = take; dfs(pos + 1, remaining - take); }
  }
  dfs(0, k);
  return results;
}

export function findBestBooking(roomMap, k) {
  if (k < 1 || k > 5) throw new Error('k must be 1..5');
  const hotel = buildHotelModel();
  const floors = [];
  for (const fl of hotel) {
    const avail = fl.rooms.filter((r) => roomMap[r.number] === 'available');
    const indices = avail.map((r) => ({ idx: r.index, number: r.number })).sort((a, b) => a.idx - b.idx);
    floors.push({ floor: fl.floor, availCount: indices.length, indices });
  }
  // same-floor
  for (const f of floors) {
    if (f.availCount >= k) {
      const sortedIdx = f.indices.map((x) => x.idx);
      const best = bestOnFloor(sortedIdx, k);
      if (best) {
        const chosen = [];
        for (const idx of best.slice) {
          const entry = f.indices.find((e) => e.idx === idx && !chosen.includes(e.number));
          chosen.push(entry.number);
        }
        return { rooms: chosen, time: calculateTravelTime(chosen) };
      }
    }
  }

  const candidateFloors = floors.filter((f) => f.availCount > 0);
  const floorNums = candidateFloors.map((f) => f.floor).sort((a, b) => a - b);
  let bestOverall = { cost: Infinity, rooms: null };
  for (let startIdx = 0; startIdx < floorNums.length; startIdx++) {
    for (let endIdx = startIdx; endIdx < floorNums.length; endIdx++) {
      const selectedFloorNums = floorNums.slice(startIdx, endIdx + 1);
      const selFloors = selectedFloorNums.map((fn) => candidateFloors.find((cf) => cf.floor === fn));
      const maxPerFloor = selFloors.map((sf) => sf.availCount);
      const comps = compositions(k, selFloors.length, maxPerFloor);
      for (const comp of comps) {
        let valid = true; const chosenRooms = [];
        for (let i = 0; i < comp.length; i++) {
          const take = comp[i];
          if (take === 0) continue;
          const indices = selFloors[i].indices.map((x) => x.idx);
          const best = bestOnFloor(indices, take);
          if (!best) { valid = false; break; }
          for (const idx of best.slice) {
            const entry = selFloors[i].indices.find((e) => e.idx === idx && !chosenRooms.includes(e.number));
            chosenRooms.push(entry.number);
          }
        }
        if (!valid || chosenRooms.length !== k) continue;
        const cost = calculateTravelTime(chosenRooms);
        if (cost < bestOverall.cost) bestOverall = { cost, rooms: chosenRooms };
      }
    }
  }
  if (bestOverall.rooms) return { rooms: bestOverall.rooms, time: calculateTravelTime(bestOverall.rooms) };
  // fallback greedy
  const availList = [];
  for (const f of candidateFloors) for (const e of f.indices) availList.push({ floor: f.floor, idx: e.idx, number: e.number });
  availList.sort((a, b) => a.floor - b.floor || a.idx - b.idx);
  let bestGreedy = { cost: Infinity, rooms: null };
  for (let i = 0; i + k - 1 < availList.length; i++) {
    const slice = availList.slice(i, i + k).map((s) => s.number);
    const cost = calculateTravelTime(slice);
    if (cost < bestGreedy.cost) bestGreedy = { cost, rooms: slice };
  }
  if (bestGreedy.rooms) return { rooms: bestGreedy.rooms, time: calculateTravelTime(bestGreedy.rooms) };
  return { rooms: [], time: 0 };
}