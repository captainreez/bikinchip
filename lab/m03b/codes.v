`timescale 1ns/1ps
// M03b: kode Gray, Hamming(7,4), SECDED(8,4), dan CRC-8 serial. Semua dapat disintesis.

// Biner -> Gray: g = b ^ (b >> 1)
module bin2gray #(parameter W = 4) (input [W-1:0] b, output [W-1:0] g);
  assign g = b ^ (b >> 1);
endmodule

// Gray -> biner: XOR prefiks dari MSB ke LSB
module gray2bin #(parameter W = 4) (input [W-1:0] g, output reg [W-1:0] b);
  integer i;
  always @* begin
    b[W-1] = g[W-1];
    for (i = W-2; i >= 0; i = i - 1) b[i] = b[i+1] ^ g[i];
  end
endmodule

// Penyandi Hamming(7,4). cw[0]=posisi 1 ... cw[6]=posisi 7. Data di posisi 3,5,6,7.
module h74_enc (input [3:0] d, output [6:0] cw);
  wire p1 = d[0] ^ d[1] ^ d[3];   // posisi 3,5,7
  wire p2 = d[0] ^ d[2] ^ d[3];   // posisi 3,6,7
  wire p4 = d[1] ^ d[2] ^ d[3];   // posisi 5,6,7
  assign cw = {d[3], d[2], d[1], p4, d[0], p2, p1};
endmodule

// Pengurai Hamming(7,4): syndrome = posisi bit salah (0 = tidak ada)
module h74_dec (input [6:0] cw, output [3:0] d, output [2:0] syn);
  assign syn[0] = cw[0] ^ cw[2] ^ cw[4] ^ cw[6];
  assign syn[1] = cw[1] ^ cw[2] ^ cw[5] ^ cw[6];
  assign syn[2] = cw[3] ^ cw[4] ^ cw[5] ^ cw[6];
  wire [6:0] fix = (syn == 3'd0) ? cw : (cw ^ (7'd1 << (syn - 3'd1)));
  assign d = {fix[6], fix[5], fix[4], fix[2]};
endmodule

// SECDED(8,4): bit 7 = paritas genap keseluruhan 7 bit lainnya
module secded_enc (input [3:0] d, output [7:0] cw8);
  wire [6:0] c;
  h74_enc u (.d(d), .cw(c));
  assign cw8 = {^c, c};
endmodule

module secded_dec (input [7:0] cw8, output [3:0] d, output single_fixed, output double_err);
  wire [2:0] syn;
  h74_dec u (.cw(cw8[6:0]), .d(d), .syn(syn));
  wire overall = ^cw8;                       // 1 bila jumlah bit satu ganjil
  assign single_fixed = overall;             // galat ganjil: dikoreksi (syn = 0 berarti bit paritas keseluruhan salah)
  assign double_err   = ~overall & (syn != 3'd0);
endmodule

// CRC-8 (poly 0x07, init 0) serial: satu bit per siklus, MSB lebih dulu
module crc8_serial (input clk, input rst, input en, input din, output reg [7:0] crc);
  wire fb = crc[7] ^ din;
  always @(posedge clk)
    if (rst) crc <= 8'h00;
    else if (en) crc <= {crc[6:0], 1'b0} ^ (fb ? 8'h07 : 8'h00);
endmodule
