/* ptr.c: aritmetika pointer, array vs pointer, pointer ke pointer, pointer fungsi, const. */
#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include <assert.h>

#pragma GCC diagnostic ignored "-Wsizeof-array-argument"   /* sengaja: inilah yang didemonstrasikan */
static int jumlah_param(int a[8]) { return (int)sizeof(a); }      /* a adalah pointer, bukan array */
static void tukar(int *x, int *y) { int t = *x; *x = *y; *y = t; }
static int tambah(int a, int b) { return a + b; }
static int kali(int a, int b) { return a * b; }
static void isi(int **pp, int *target) { *pp = target; }

int main(void) {
    int32_t a[4] = { 0x11223344, (int32_t)0xAABBCCDD, 1, -2 };
    unsigned char *byte = (unsigned char *)a;      /* char boleh melihat byte objek apa pun */

    /* 1. alamat(p + n) = alamat(p) + n * sizeof(*p) */
    int32_t *p = a;
    assert((uintptr_t)(p + 2) - (uintptr_t)p == 8);
    assert((char *)(p + 2) - (char *)p == 8);
    assert((p + 3) - p == 3);                       /* selisih pointer dihitung dalam elemen */
    int16_t *h = (int16_t *)a;
    assert((uintptr_t)(h + 2) - (uintptr_t)h == 4);

    /* 2. a[i] == *(a+i) == i[a] */
    assert(a[2] == *(a + 2) && *(a + 2) == 2[a]);

    /* 3. little-endian: byte pertama objek 0x11223344 adalah 0x44 */
    uint16_t lo; memcpy(&lo, byte, 2);
    printf("byte[0..3] = %02X %02X %02X %02X\n", byte[0], byte[1], byte[2], byte[3]);
    printf("16 bit pertama (memcpy) = 0x%04X\n", lo);
    assert(byte[0] == 0x44 && byte[3] == 0x11 && lo == 0x3344);

    /* 4. array vs pointer */
    int arr[8] = {0};
    printf("sizeof(arr)=%zu sizeof(parameter)=%d\n", sizeof(arr), jumlah_param(arr));
    assert(sizeof(arr) == 32 && jumlah_param(arr) == (int)sizeof(int *));
    assert((&arr[1] - &arr[0]) == 1 && (char *)&arr[1] - (char *)&arr[0] == 4);

    /* 5. tukar lewat pointer */
    int u = 3, v = 9; tukar(&u, &v); assert(u == 9 && v == 3);

    /* 6. pointer ke pointer */
    int x = 7, *px = NULL; isi(&px, &x); assert(px == &x && *px == 7);

    /* 7. tabel pointer fungsi */
    int (*op[2])(int, int) = { tambah, kali };
    printf("op[0](6,7)=%d op[1](6,7)=%d\n", op[0](6, 7), op[1](6, 7));
    assert(op[0](6, 7) == 13 && op[1](6, 7) == 42);

    /* 8. const: pointer ke const lawan pointer const */
    const int c = 5; const int *pc = &c;            /* isi tak boleh diubah lewat pc */
    int y = 1, z = 2; int *const tetap = &y;        /* alamat tak boleh diubah */
    *tetap = 10; pc = &z;                           /* keduanya sah */
    assert(y == 10 && *pc == 2 && c == 5);

    /* 9. string: array lawan pointer ke literal */
    char s[] = "IC"; const char *t = "IC";
    assert(sizeof(s) == 3 && strlen(t) == 2 && strcmp(s, t) == 0);

    printf("semua pemeriksaan ptr.c lulus\n");
    return 0;
}
