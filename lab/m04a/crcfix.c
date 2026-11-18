/* crcfix.c: CRC-8, CRC-32, dan perkalian Q1.15 dalam C; nilai dibandingkan dengan M03a dan M03b. */
#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include <assert.h>

static uint8_t crc8(const uint8_t *d, size_t n) {            /* poly 0x07, init 0, MSB lebih dulu */
    uint8_t r = 0;
    for (size_t i = 0; i < n; i++) {
        r ^= d[i];
        for (int k = 0; k < 8; k++) r = (r & 0x80) ? (uint8_t)((r << 1) ^ 0x07) : (uint8_t)(r << 1);
    }
    return r;
}

static uint32_t crc32(const uint8_t *d, size_t n) {          /* Ethernet/zlib: refleksi, init dan xorout 0xFFFFFFFF */
    uint32_t r = 0xFFFFFFFFu;
    for (size_t i = 0; i < n; i++) {
        r ^= d[i];
        for (int k = 0; k < 8; k++) r = (r & 1u) ? (r >> 1) ^ 0xEDB88320u : (r >> 1);
    }
    return ~r;
}

static int16_t q15_mul(int16_t a, int16_t b) {               /* (a*b + 0.5 LSB) >> 15, saturasi */
    int32_t p = (int32_t)a * (int32_t)b;
    p = (p + (1 << 14)) >> 15;                               /* geser kanan bilangan negatif: aritmetika pada gcc/clang */
    if (p > 32767) p = 32767;
    if (p < -32768) p = -32768;
    return (int16_t)p;
}

int main(void) {
    const uint8_t msg[] = "123456789";
    printf("CRC-8  = 0x%02X\n", crc8(msg, 9));
    printf("CRC-32 = 0x%08X\n", crc32(msg, 9));
    assert(crc8(msg, 9) == 0xF4 && crc32(msg, 9) == 0xCBF43926u);

    int16_t x = 22938;                                       /* 0.7 dalam Q1.15 */
    int16_t y = q15_mul(x, x);
    printf("Q1.15: 0.7 -> %d, 0.7*0.7 -> %d (= %.6f)\n", x, y, y / 32768.0);
    assert(x == 22938 && y == 16057);
    assert(q15_mul(-32768, -32768) == 32767);                /* (-1)*(-1) harus tersaturasi */
    assert(q15_mul(16384, 16384) == 8192);                   /* 0.5*0.5 = 0.25 */
    return 0;
}
