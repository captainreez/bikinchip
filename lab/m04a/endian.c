/* endian.c: membangun bilangan dari byte secara eksplisit (tanpa cast pointer), dan menukar urutan byte. */
#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include <assert.h>

static uint32_t read_be32(const uint8_t *b) { return ((uint32_t)b[0] << 24) | ((uint32_t)b[1] << 16) | ((uint32_t)b[2] << 8) | (uint32_t)b[3]; }
static uint32_t read_le32(const uint8_t *b) { return ((uint32_t)b[3] << 24) | ((uint32_t)b[2] << 16) | ((uint32_t)b[1] << 8) | (uint32_t)b[0]; }
static void     write_be32(uint8_t *b, uint32_t v) { b[0] = (uint8_t)(v >> 24); b[1] = (uint8_t)(v >> 16); b[2] = (uint8_t)(v >> 8); b[3] = (uint8_t)v; }
static uint32_t swap32(uint32_t v) { return (v >> 24) | ((v >> 8) & 0x0000FF00u) | ((v << 8) & 0x00FF0000u) | (v << 24); }

int main(void) {
    const uint8_t paket[4] = { 0x11, 0x22, 0x33, 0x44 };
    printf("be32 = 0x%08X, le32 = 0x%08X\n", read_be32(paket), read_le32(paket));
    assert(read_be32(paket) == 0x11223344u && read_le32(paket) == 0x44332211u);
    assert(swap32(read_be32(paket)) == read_le32(paket));

    uint8_t out[4]; write_be32(out, 0xAABBCCDDu);
    assert(out[0] == 0xAA && out[3] == 0xDD);

    uint32_t host = 0x11223344u; uint8_t mem[4]; memcpy(mem, &host, 4);   /* urutan byte mesin ini */
    printf("byte di memori: %02X %02X %02X %02X (%s-endian)\n", mem[0], mem[1], mem[2], mem[3], mem[0] == 0x44 ? "little" : "big");
    assert(read_le32(mem) == host || read_be32(mem) == host);
    printf("semua pemeriksaan endian.c lulus\n");
    return 0;
}
