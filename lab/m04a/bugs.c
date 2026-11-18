/* bugs.c: lima bug klasik, dipilih lewat argumen. Jalankan dengan sanitizer (lihat lab).
   1 = tulis melewati array di stack   2 = pakai memori setelah free   3 = overflow int bertanda
   4 = baca di luar array heap          5 = akses tak sejajar (misaligned) */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <limits.h>

int main(int argc, char **argv) {
    int bug = argc > 1 ? atoi(argv[1]) : 0;
    volatile int sink = 0;
    switch (bug) {
    case 1: { int buf[4]; for (int i = 0; i <= 4; i++) buf[i] = i; sink = buf[0]; break; }     /* <= salah: seharusnya < */
    case 2: { int *p = malloc(4 * sizeof *p); p[0] = 7; free(p); sink = p[0]; break; }
    case 3: { int big = INT_MAX; big = big + (argc > 0 ? 1 : 0); sink = big; break; }
    case 4: { int *p = malloc(4 * sizeof *p); memset(p, 0, 4 * sizeof *p); sink = p[4]; free(p); break; }
    case 5: { unsigned char raw[8] = {0}; int *q = (int *)(raw + 1); sink = *q; break; }
    default: printf("tidak ada bug dipilih\n"); return 0;
    }
    printf("selesai tanpa laporan (sink=%d)\n", sink);
    return 0;
}
