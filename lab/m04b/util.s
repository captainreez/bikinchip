# util.s: int add_mul(int a, int b) = (a + b) * a ; untuk 4 dan 5 hasilnya 36.
        .intel_syntax noprefix
        .globl  add_mul
        .text
        .p2align 4                  # mulai di alamat kelipatan 16
add_mul:
        lea     eax, [rdi + rsi]
        imul    eax, edi
        ret
