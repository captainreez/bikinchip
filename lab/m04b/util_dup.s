# util_dup.s: definisi kedua add_mul, untuk memicu galat "multiple definition".
        .intel_syntax noprefix
        .globl  add_mul
        .text
add_mul:
        mov     eax, 0
        ret
