from math import log
from pn import is_sat, current, voltage, vt, cdiff, cj, storage_time, igen

NA, ND, AREA, TAU = 1e18, 1e16, 1e-4, 1e-6          # dioda p+/n, 100 um x 100 um
for T in (300.0, 350.0):
    isat = is_sat(NA, ND, AREA, TAU, T)
    print("T=%.0f K  Is=%.4e A  Vt=%.4f V" % (T, isat, vt(T)))
    for i in (1e-9, 1e-6, 1e-3):
        print("   I=%.0e A -> V=%.4f V   (Rs=0)" % (i, voltage(i, isat, 1.0, 0.0, T)))
isat = is_sat(NA, ND, AREA, TAU)
v1, v2 = voltage(1e-3, isat), voltage(1e-4, isat)
print("kemiringan: %.1f mV/dekade (n=1), %.1f mV/dekade (n=2)" % ((v1 - v2) * 1e3, 2 * (v1 - v2) * 1e3))
print("rd pada 1 mA: %.2f ohm" % (vt() / 1e-3))
print("dV/dT pada 1 mA: %.2f mV/K" % ((voltage(1e-3, is_sat(NA, ND, AREA, TAU, 301.0), 1.0, 0.0, 301.0) - voltage(1e-3, is_sat(NA, ND, AREA, TAU, 299.0), 1.0, 0.0, 299.0)) / 2 * 1e3))
print("bias mundur -1 V: I = %.3e A (= -Is)" % current(-1.0, isat))
print("dengan Rs = 10 ohm, 10 mA: V = %.4f V (Rs=0: %.4f V)" % (voltage(1e-2, isat, 1.0, 10.0), voltage(1e-2, isat)))
print("kapasitansi difusi pada 1 mA (tau = 1 us): %.2f nF; Cj(0 V) = %.2f pF" % (cdiff(1e-3, TAU) * 1e9, cj(NA, ND, 0.0, AREA) * 1e12))
print("waktu penyimpanan: IF=10 mA, IR=5 mA -> ts = %.3f us" % (storage_time(10e-3, 5e-3, TAU) * 1e6))
for v in (-1.0, -5.0):
    print("arus generasi pada %.0f V: %.3e A  (%.0f kali Is)" % (v, igen(NA, ND, v, AREA), igen(NA, ND, v, AREA) / isat))
print("arus generasi: x%.2f dari 300 ke 310 K" % (igen(NA, ND, -5.0, AREA, 1e-6, 310.0) / igen(NA, ND, -5.0, AREA)))
