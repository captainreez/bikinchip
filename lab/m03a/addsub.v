`timescale 1ns/1ps
// M03a: penjumlah/pengurang W bit dengan flag, dan penjumlah saturasi.
module addsub #(parameter W = 8) (
    input  wire [W-1:0] a, b,
    input  wire         sub,          // 0: a + b, 1: a - b = a + ~b + 1
    output wire [W-1:0] y,
    output wire         carry,        // carry-out; pada pengurangan: 1 berarti tidak ada pinjaman
    output wire         overflow      // luapan bilangan bertanda
);
    wire [W-1:0] bb = sub ? ~b : b;
    wire [W:0]   t  = {1'b0, a} + {1'b0, bb} + {{W{1'b0}}, sub};
    assign y        = t[W-1:0];
    assign carry    = t[W];
    assign overflow = (a[W-1] == bb[W-1]) && (y[W-1] != a[W-1]);
endmodule

module satadd #(parameter W = 8) (
    input  wire [W-1:0] a, b,
    output wire [W-1:0] y             // a + b bertanda, tersaturasi ke [-2^(W-1), 2^(W-1)-1]
);
    wire [W-1:0] s;
    wire         c, v;
    addsub #(.W(W)) u (.a(a), .b(b), .sub(1'b0), .y(s), .carry(c), .overflow(v));
    // luapan: hasil harus berlawanan tanda dari operand; operand positif (a[W-1]=0) -> maks, negatif -> min
    assign y = v ? (a[W-1] ? {1'b1, {(W-1){1'b0}}} : {1'b0, {(W-1){1'b1}}}) : s;
endmodule
