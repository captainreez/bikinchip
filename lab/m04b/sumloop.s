# sumloop.s: tiga fungsi tangan (x86-64, sintaks Intel, konvensi System V: argumen rdi, rsi, rdx; hasil rax)
        .intel_syntax noprefix
        .text
        .globl  sum_to
sum_to:                         # long sum_to(long n): jumlah 1..n (0 bila n <= 0)
        xor     eax, eax        # rax = 0
        test    rdi, rdi        # set flag dari n
        jle     .Lsum_done      # n <= 0: selesai
.Lsum_loop:
        add     rax, rdi        # rax += n
        dec     rdi             # n--
        jnz     .Lsum_loop      # ulangi sampai n == 0
.Lsum_done:
        ret

        .globl  fact_it
fact_it:                        # long fact_it(long n): n! untuk n >= 1 (1 bila n <= 1)
        mov     eax, 1
        cmp     rdi, 1
        jle     .Lfact_done
.Lfact_loop:
        imul    rax, rdi        # rax *= n
        dec     rdi
        cmp     rdi, 1
        jg      .Lfact_loop
.Lfact_done:
        ret

        .globl  mac
mac:                            # long mac(long a, long b, long c): a*b + c
        imul    rdi, rsi        # rdi = a*b
        lea     rax, [rdi + rdx]  # rax = a*b + c (lea dipakai sebagai penjumlah)
        ret

        .section .note.GNU-stack,"",@progbits
