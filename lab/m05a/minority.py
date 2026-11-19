from math import exp, sqrt
from semi import einstein_d, mobility

for mu in (1400.0, 1000.0, 450.0, 200.0):
    print("mu=%6.0f cm2/Vs -> D = %.2f cm2/s (300 K)" % (mu, einstein_d(mu)))

def solve(L, W, n0, N=400):
    """D n'' - n/tau = 0, n(0)=n0, n(W)=0, dengan skema beda hingga tridiagonal (algoritma Thomas)."""
    h = W / N
    a = [1.0 / h ** 2] * (N - 1)               # bawah
    b = [-(2.0 / h ** 2 + 1.0 / L ** 2)] * (N - 1)
    c = [1.0 / h ** 2] * (N - 1)               # atas
    d = [0.0] * (N - 1)
    d[0] = -n0 / h ** 2
    cp, dp = [0.0] * (N - 1), [0.0] * (N - 1)
    cp[0], dp[0] = c[0] / b[0], d[0] / b[0]
    for i in range(1, N - 1):
        m = b[i] - a[i] * cp[i - 1]
        cp[i] = c[i] / m
        dp[i] = (d[i] - a[i] * dp[i - 1]) / m
    x = [0.0] * (N - 1)
    x[-1] = dp[-1]
    for i in range(N - 3, -1, -1):
        x[i] = dp[i] - cp[i] * x[i + 1]
    return [n0] + x + [0.0], h

D = einstein_d(mobility(1e16, 'p'))          # hole sebagai pembawa minoritas pada bahan n 1e16
tau = 1e-6
L = sqrt(D * tau)
print("D_p = %.2f cm2/s, tau = %.0e s, L = %.1f um" % (D, tau, L * 1e4))
prof, h = solve(L, 10 * L, 1e14)
err = max(abs(prof[i] - 1e14 * exp(-i * h / L)) for i in range(len(prof))) / 1e14
print("beda hingga vs 1e14 exp(-x/L): kesalahan maksimum = %.2e dari n0" % err)
for k in (1, 2, 3):
    i = round(k * L / h)
    print("x = %d L = %.0f um: n = %.3e (analitik %.3e)" % (k, k * L * 1e4, prof[i], 1e14 * exp(-k)))
print("arus difusi di x=0 (J = q D n0 / L): %.3e A/cm2" % (1.602176634e-19 * D * 1e14 / L))
