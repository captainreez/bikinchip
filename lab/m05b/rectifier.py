from math import sin, pi, exp
from pn import is_sat, vt

ISAT = is_sat(1e18, 1e16, 1e-2, 1e-6)       # dioda 1 mm^2
VT = vt()


def idiode(v):
    return ISAT * (exp(min(v / VT, 700.0)) - 1.0)


def simulate(vpk, freq, c, rl, cycles=8, steps=400):
    """Penyearah setengah gelombang + kapasitor + beban. Euler mundur, tiap langkah
    diselesaikan dengan bisection pada tegangan kapasitor."""
    dt = 1.0 / (freq * steps)
    vc = 0.0
    out, ipk = [], 0.0
    for k in range(cycles * steps):
        vin = vpk * sin(2 * pi * freq * (k + 1) * dt)
        lo, hi = -1.0, vpk + 1.0
        for _ in range(70):
            mid = 0.5 * (lo + hi)
            g = c * (mid - vc) / dt + mid / rl - idiode(vin - mid)
            if g > 0:
                hi = mid
            else:
                lo = mid
        vc = 0.5 * (lo + hi)
        out.append((vin, vc, idiode(vin - vc)))
    last = out[-steps:]
    vmax = max(x[1] for x in last)
    vmin = min(x[1] for x in last)
    ipk = max(x[2] for x in last)
    cond = sum(1 for x in last if x[2] > 1e-3 * ipk)
    return vmax, vmin, ipk, 360.0 * cond / steps


if __name__ == "__main__":
    print("Is = %.4e A (1 mm2)" % ISAT)
    for vpk, f, c, rl in [(5.0, 50.0, 100e-6, 1000.0), (5.0, 50.0, 1000e-6, 1000.0), (5.0, 50.0, 100e-6, 100.0), (12.0, 60.0, 470e-6, 220.0)]:
        vmax, vmin, ipk, ang = simulate(vpk, f, c, rl)
        est = (vmax) / (f * rl * c)
        print("Vpk=%4.1f f=%2.0f C=%5.0f uF RL=%4.0f: Vo max=%.3f, ripple=%.3f V (rumus %.3f), Ipk=%.3f A, sudut hantar=%.0f derajat"
              % (vpk, f, c * 1e6, rl, vmax, vmax - vmin, est, ipk, ang))
