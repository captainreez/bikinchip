/* test_bits.c: uji bits.h, peta register bergaya peripheral, dan jebakan RMW pada register write-1-to-clear. */
#include <stdio.h>
#include <stdint.h>
#include <assert.h>
#include "bits.h"

/* model peripheral: STATUS bersifat write-1-to-clear (W1C): menulis 1 menghapus bit itu */
typedef struct { uint32_t status; } fake_t;
static uint32_t fake_read_status(const fake_t *f)    { return f->status; }
static void     fake_write_status(fake_t *f, uint32_t w) { f->status &= ~w; }

int main(void) {
    uint32_t r = 0xA5C3F00Fu;

    /* kasus yang sama dengan visualisasi 4 */
    assert(field_mask(12, 4) == 0x0000F000u);
    assert(~field_mask(12, 4) == 0xFFFF0FFFu);
    assert((r & ~field_mask(12, 4)) == 0xA5C3000Fu);
    assert(set_field(r, 12, 4, 0x9) == 0xA5C3900Fu);
    assert(get_field(r, 12, 4) == 0xFu);
    assert(toggle_bits(r, field_mask(12, 4)) == 0xA5C3000Fu);
    assert(clear_bits(r, field_mask(12, 4)) == 0xA5C3000Fu);
    assert(set_bits(r, field_mask(4, 4)) == 0xA5C3F0FFu);

    /* tepi: lebar 32 dan 1, nilai terlalu lebar dipotong */
    assert(mask(32) == 0xFFFFFFFFu && mask(1) == 1u && mask(0) == 0u);
    assert(set_field(0, 28, 4, 0x1F) == 0xF0000000u);      /* nilai 0x1F dipotong ke 0xF */
    assert(set_field(0xFFFFFFFFu, 0, 32, 0x12345678u) == 0x12345678u);
    assert(bit(31) == 0x80000000u);

    /* urutan sub-field: ambil byte ke-2 lalu rakit ulang */
    uint32_t w = 0x12345678u;
    assert(get_field(w, 16, 8) == 0x34u && get_field(w, 24, 8) == 0x12u);
    uint32_t rebuilt = 0; for (unsigned i = 0; i < 4; i++) rebuilt = set_field(rebuilt, 8 * i, 8, get_field(w, 8 * (3 - i), 8));
    assert(rebuilt == 0x78563412u);                         /* tukar urutan byte */

    /* jebakan W1C: "status |= BIT(3)" menghapus SEMUA flag yang aktif, bukan hanya bit 3 */
    fake_t f = { .status = bit(1) | bit(3) | bit(5) };
    fake_write_status(&f, fake_read_status(&f) | bit(3));   /* cara salah: baca-ubah-tulis */
    assert(f.status == 0);
    f.status = bit(1) | bit(3) | bit(5);
    fake_write_status(&f, bit(3));                          /* cara benar: tulis hanya bit yang dimaksud */
    assert(f.status == (bit(1) | bit(5)));

    printf("semua pemeriksaan test_bits.c lulus\n");
    return 0;
}
