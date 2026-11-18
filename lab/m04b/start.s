# start.s: titik masuk; memanggil add_mul yang didefinisikan di util.s, lalu keluar dengan hasilnya sebagai kode keluar.
        .intel_syntax noprefix
        .globl  _start
        .text
_start:
        mov     edi, 4
        mov     esi, 5
        call    add_mul             # alamat add_mul belum diketahui: assembler menaruh 0 dan entri relokasi
        mov     edi, eax            # kode keluar = hasil
        mov     eax, 60             # sys_exit
        syscall
