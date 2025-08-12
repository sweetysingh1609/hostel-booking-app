import { buildHotelModel, calculateTravelTime, findBestBooking } from '../bookingLogic';

test('travel time single floor contiguous', () => {
  expect(calculateTravelTime([101, 104])).toBe(3); // indices 0 and 3 -> horizontal span 3
});

test('prefer same floor', () => {
  const hotel = buildHotelModel();
  const map = {};
  for (const f of hotel) for (const r of f.rooms) map[r.number] = 'available';
  // occupy rooms 103,104 on floor1 (so left with 101,102,105,106)
  map[103] = 'occupied'; map[104] = 'occupied';
  const res = findBestBooking(map, 4);
  expect(res.rooms.length).toBe(4);
  // ensure result rooms belong to same floor (floor 1)
  expect(res.rooms.every(r => Math.floor(r/100) === 1)).toBe(true);
});

test('book across floors when needed with minimal travel', () => {
  const hotel = buildHotelModel();
  const map = {};
  for (const f of hotel) for (const r of f.rooms) map[r.number] = 'available';
  // Make only 2 rooms available on each of floors 1 and 2
  Object.keys(map).forEach(k => {
    const floor = Math.floor(k / 100);
    if (floor === 1 && ![101, 102].includes(Number(k))) map[k] = 'occupied';
    if (floor === 2 && ![201, 202].includes(Number(k))) map[k] = 'occupied';
    if (floor > 2) map[k] = 'occupied';
  });
  const res = findBestBooking(map, 4);
  // Should pick 101, 102, 201, 202 due to minimal vertical + horizontal time
  expect(res.rooms.sort()).toEqual([101, 102, 201, 202]);
});

test('handle top floor edge case', () => {
  const hotel = buildHotelModel();
  expect(hotel.find(f => f.floor === 10).rooms.length).toBe(7);
});

test('reject invalid booking requests gracefully', () => {
  const hotel = buildHotelModel();
  const map = {};
  for (const f of hotel) for (const r of f.rooms) map[r.number] = 'available';
  expect(() => findBestBooking(map, 6)).toThrow();
});
