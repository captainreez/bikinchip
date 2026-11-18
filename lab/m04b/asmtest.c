/* asmtest.c: memanggil fungsi assembly dari C dan membandingkannya dengan versi C. */
#include <stdio.h>
#include <assert.h>

long sum_to(long n);
long fact_it(long n);
long mac(long a, long b, long c);

static long sum_c(long n)  { long s = 0; while (n > 0) { s += n; n--; } return s; }
static long fact_c(long n) { long r = 1; while (n > 1) { r *= n; n--; } return r; }

int main(void) {
    for (long n = -3; n <= 20; n++) assert(sum_to(n) == sum_c(n));
    for (long n = 0; n <= 12; n++)  assert(fact_it(n) == fact_c(n));
    assert(sum_to(10) == 55 && sum_to(0) == 0 && sum_to(-3) == 0);
    assert(fact_it(5) == 120 && fact_it(12) == 479001600L);
    assert(mac(3, 4, 5) == 17 && mac(-2, 6, 1) == -11);
    printf("sum_to(10) = %ld, fact_it(5) = %ld, mac(3,4,5) = %ld\n", sum_to(10), fact_it(5), mac(3, 4, 5));
    printf("semua pemeriksaan asmtest lulus\n");
    return 0;
}
