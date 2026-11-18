/* layout.c: ukuran, perataan, dan offset struct; urutan byte mesin.
   Asumsi: Linux/WSL2 x86-64 atau ARM64 (model LP64: pointer 8 byte, long 8 byte). */
#include <stdio.h>
#include <stddef.h>
#include <stdint.h>
#include <string.h>
#include <assert.h>

struct deklarasi { char a; int b; char c; double d; short e; };      /* urutan "alami" */
struct tersusun  { double d; int b; short e; char a; char c; };      /* besar ke kecil */
struct __attribute__((packed)) rapat { char a; int b; char c; double d; short e; };

/* peta register ala peripheral: setiap field 32 bit, offset tetap */
struct uart_regs { uint32_t ctrl; uint32_t status; uint32_t data; uint32_t baud; };

#if defined(__LP64__)
_Static_assert(sizeof(void *) == 8, "pointer 8 byte");
_Static_assert(sizeof(struct deklarasi) == 32, "deklarasi 32 byte");
_Static_assert(sizeof(struct tersusun) == 16, "tersusun 16 byte");
_Static_assert(sizeof(struct rapat) == 16, "rapat 16 byte");
_Static_assert(offsetof(struct deklarasi, b) == 4 && offsetof(struct deklarasi, d) == 16 && offsetof(struct deklarasi, e) == 24, "offset deklarasi");
_Static_assert(offsetof(struct tersusun, d) == 0 && offsetof(struct tersusun, b) == 8 && offsetof(struct tersusun, e) == 12, "offset tersusun");
#endif
_Static_assert(sizeof(struct uart_regs) == 16 && offsetof(struct uart_regs, data) == 8, "peta register UART");

static int little_endian(void) { uint32_t x = 1; unsigned char b; memcpy(&b, &x, 1); return b == 1; }

int main(void) {
    printf("ukuran dasar: char=%zu short=%zu int=%zu long=%zu pointer=%zu double=%zu\n",
           sizeof(char), sizeof(short), sizeof(int), sizeof(long), sizeof(void *), sizeof(double));
    printf("deklarasi: sizeof=%zu alignof=%zu | a@%zu b@%zu c@%zu d@%zu e@%zu\n", sizeof(struct deklarasi), _Alignof(struct deklarasi),
           offsetof(struct deklarasi, a), offsetof(struct deklarasi, b), offsetof(struct deklarasi, c), offsetof(struct deklarasi, d), offsetof(struct deklarasi, e));
    printf("tersusun : sizeof=%zu alignof=%zu | d@%zu b@%zu e@%zu a@%zu c@%zu\n", sizeof(struct tersusun), _Alignof(struct tersusun),
           offsetof(struct tersusun, d), offsetof(struct tersusun, b), offsetof(struct tersusun, e), offsetof(struct tersusun, a), offsetof(struct tersusun, c));
    printf("rapat    : sizeof=%zu alignof=%zu | b@%zu d@%zu\n", sizeof(struct rapat), _Alignof(struct rapat), offsetof(struct rapat, b), offsetof(struct rapat, d));
    printf("uart_regs: sizeof=%zu | ctrl@%zu status@%zu data@%zu baud@%zu\n", sizeof(struct uart_regs),
           offsetof(struct uart_regs, ctrl), offsetof(struct uart_regs, status), offsetof(struct uart_regs, data), offsetof(struct uart_regs, baud));
    printf("urutan byte mesin: %s-endian\n", little_endian() ? "little" : "big");
    assert(sizeof(int) == 4 && sizeof(short) == 2 && sizeof(char) == 1);
    return 0;
}
