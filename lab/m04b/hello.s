# hello.s: program tanpa libc; dua system call Linux x86-64 (nomor di rax, argumen di rdi, rsi, rdx).
        .intel_syntax noprefix
        .globl  _start
        .text
_start:
        mov     eax, 1              # sys_write
        mov     edi, 1              # fd 1 = stdout
        lea     rsi, [rip + msg]    # alamat teks (relatif terhadap rip)
        mov     edx, 15             # panjang: "Halo, silikon!\n" = 15 byte
        syscall                     # masuk ke kernel
        mov     eax, 60             # sys_exit
        mov     edi, 7              # kode keluar 7
        syscall

        .section .rodata
msg:    .ascii  "Halo, silikon!\n"
