// Total Fluid Removed (TFR) calculation.
// Formula: IF(drain_volume < 100, ultrafiltration, drain_volume - 2000 + ultrafiltration)
export const calcTFR = (drainVolume, ultrafiltration) => {
  const d = Number(drainVolume) || 0;
  const uf = Number(ultrafiltration) || 0;
  return d < 100 ? uf : d - 2000 + uf;
};