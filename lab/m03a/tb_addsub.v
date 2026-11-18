`timescale 1ns/1ps
module tb_addsub;
    reg  [7:0] a, b;
    reg        sub;
    wire [7:0] y, ys;
    wire       carry, overflow;
    integer    i, j, errors, checks;
    integer    sa, sb, ref_s, ref_u;

    addsub #(.W(8)) dut (.a(a), .b(b), .sub(sub), .y(y), .carry(carry), .overflow(overflow));
    satadd #(.W(8)) dsat (.a(a), .b(b), .y(ys));

    function integer sgn(input [7:0] v);
        sgn = (v >= 128) ? v - 256 : v;
    endfunction

    initial begin
        errors = 0; checks = 0;
        for (i = 0; i < 256; i = i + 1)
            for (j = 0; j < 256; j = j + 1) begin
                a = i; b = j; sa = sgn(a); sb = sgn(b);
                // penjumlahan
                sub = 0; #1;
                ref_s = sa + sb; ref_u = i + j;
                if (y !== (ref_u & 255) || carry !== (ref_u > 255) || overflow !== (ref_s > 127 || ref_s < -128)) begin
                    errors = errors + 1; if (errors < 5) $display("SALAH add a=%0d b=%0d y=%0d c=%b v=%b", sa, sb, sgn(y), carry, overflow);
                end
                // saturasi
                if (sgn(ys) !== (ref_s > 127 ? 127 : ref_s < -128 ? -128 : ref_s)) begin
                    errors = errors + 1; if (errors < 5) $display("SALAH sat a=%0d b=%0d y=%0d", sa, sb, sgn(ys));
                end
                // pengurangan
                sub = 1; #1;
                ref_s = sa - sb; ref_u = i - j;
                if (y !== (ref_u & 255) || carry !== (i >= j) || overflow !== (ref_s > 127 || ref_s < -128)) begin
                    errors = errors + 1; if (errors < 5) $display("SALAH sub a=%0d b=%0d y=%0d c=%b v=%b", sa, sb, sgn(y), carry, overflow);
                end
                checks = checks + 3;
            end
        if (errors == 0) $display("LULUS: %0d pemeriksaan (semua pasangan a, b 8 bit: tambah, kurang, saturasi)", checks);
        else             $display("GAGAL: %0d kesalahan", errors);
        $finish;
    end
endmodule
