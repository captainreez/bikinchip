/* bits.h: manipulasi bit dan field register yang aman (tanpa 1u<<32). Hanya inline, tanpa evaluasi ganda. */
#ifndef BITS_H
#define BITS_H
#include <stdint.h>

static inline uint32_t bit(unsigned n)            { return (uint32_t)1u << n; }                 /* n: 0..31 */
static inline uint32_t mask(unsigned w)           { return w >= 32u ? 0xFFFFFFFFu : (((uint32_t)1u << w) - 1u); }
static inline uint32_t field_mask(unsigned lsb, unsigned w) { return mask(w) << lsb; }
static inline uint32_t get_field(uint32_t r, unsigned lsb, unsigned w) { return (r >> lsb) & mask(w); }
static inline uint32_t set_field(uint32_t r, unsigned lsb, unsigned w, uint32_t v) {
    uint32_t m = field_mask(lsb, w);
    return (r & ~m) | ((v << lsb) & m);
}
static inline uint32_t set_bits(uint32_t r, uint32_t m)    { return r | m; }
static inline uint32_t clear_bits(uint32_t r, uint32_t m)  { return r & ~m; }
static inline uint32_t toggle_bits(uint32_t r, uint32_t m) { return r ^ m; }

#endif
