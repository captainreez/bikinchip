`timescale 1ns/1ps
module tb_codes;
  integer errors = 0, checks = 0;
  // ---- Gray (W = 4 dan 8) ----
  reg  [7:0] b8; wire [7:0] g8, rb8, g8n;
  bin2gray #(8) u_g (.b(b8), .g(g8));
  gray2bin #(8) u_r (.g(g8), .b(rb8));
  reg  [7:0] b8n; bin2gray #(8) u_gn (.b(b8n), .g(g8n));
  wire [7:0] gx = g8 ^ g8n;
  // ---- Hamming dan SECDED ----
  reg  [3:0] d; wire [6:0] cw; wire [7:0] cw8;
  h74_enc    u_he (.d(d), .cw(cw));
  secded_enc u_se (.d(d), .cw8(cw8));
  reg  [6:0] rx7; wire [3:0] dd7; wire [2:0] syn7;
  h74_dec    u_hd (.cw(rx7), .d(dd7), .syn(syn7));
  reg  [7:0] rx8; wire [3:0] dd8; wire sf, de;
  secded_dec u_sd (.cw8(rx8), .d(dd8), .single_fixed(sf), .double_err(de));
  // ---- CRC-8 serial ----
  reg clk = 0, rst = 1, en = 0, din = 0; wire [7:0] crc;
  crc8_serial u_c (.clk(clk), .rst(rst), .en(en), .din(din), .crc(crc));
  always #5 clk = ~clk;
  reg [7:0] vec [0:255];
  reg [7:0] msg [0:12];

  task chk(input ok, input [255:0] what);
    begin checks = checks + 1; if (!ok) begin errors = errors + 1; if (errors < 6) $display("SALAH: %0s", what); end end
  endtask

  task crc_byte(input [7:0] x);
    integer k;
    begin
      for (k = 7; k >= 0; k = k - 1) begin din = x[k]; en = 1; @(posedge clk); #1; end
      en = 0;
    end
  endtask
  task crc_reset; begin rst = 1; @(posedge clk); #1; rst = 0; end endtask

  integer i, j, k, n;
  reg [7:0] c0;
  initial begin
    $readmemh("crc8_vec.hex", vec);
    // Gray
    for (i = 0; i < 256; i = i + 1) begin
      b8 = i; b8n = (i + 1) % 256; #1;
      chk(rb8 === b8, "gray roundtrip");
      chk($countones(gx) == 1, "gray tetangga 1 bit");
    end
    // Hamming(7,4)
    for (i = 0; i < 16; i = i + 1) begin
      d = i; #1;
      rx7 = cw; #1; chk(dd7 === d && syn7 === 3'd0, "h74 tanpa galat");
      for (j = 0; j < 7; j = j + 1) begin rx7 = cw ^ (7'd1 << j); #1; chk(dd7 === d && syn7 === j + 1, "h74 koreksi 1 galat"); end
      // SECDED
      rx8 = cw8; #1; chk(dd8 === d && !sf && !de, "secded tanpa galat");
      for (j = 0; j < 8; j = j + 1) begin rx8 = cw8 ^ (8'd1 << j); #1; chk(dd8 === d && sf && !de, "secded koreksi 1 galat"); end
      for (j = 0; j < 8; j = j + 1) for (k = j + 1; k < 8; k = k + 1) begin
        rx8 = cw8 ^ (8'd1 << j) ^ (8'd1 << k); #1; chk(de && !sf, "secded deteksi 2 galat");
      end
    end
    // CRC-8: nilai cek baku "123456789" = 0xF4
    crc_reset;
    crc_byte("1"); crc_byte("2"); crc_byte("3"); crc_byte("4"); crc_byte("5"); crc_byte("6"); crc_byte("7"); crc_byte("8"); crc_byte("9");
    chk(crc === 8'hF4, "crc8 cek baku 123456789");
    // 256 pesan satu byte terhadap tabel dari Python
    for (i = 0; i < 256; i = i + 1) begin crc_reset; crc_byte(i); chk(crc === vec[i], "crc8 satu byte vs Python"); end
    // pesan 12 byte + CRC: sisa 0; semua galat 1 bit dan semua burst <= 8 bit terdeteksi
    for (i = 0; i < 12; i = i + 1) msg[i] = i + 1;
    crc_reset; for (i = 0; i < 12; i = i + 1) crc_byte(msg[i]); msg[12] = crc;
    crc_reset; for (i = 0; i < 13; i = i + 1) crc_byte(msg[i]); chk(crc === 8'h00, "crc8 sisa 0 pada pesan utuh");
    for (n = 1; n <= 8; n = n + 1)
      for (j = 0; j <= 13*8 - n; j = j + 1)
        for (k = 0; k < (1 << n); k = k + 1) if (k[0] && k[n-1]) begin   // burst tepat n bit: ujung-ujungnya 1
          crc_reset;
          for (i = 0; i < 13; i = i + 1) begin
            c0 = msg[i];
            // balik bit pesan (urutan bit global: indeks 0 = MSB byte 0)
            for (integer q = 0; q < n; q = q + 1)
              if (k[q] && ((j + q) / 8 == i)) c0[7 - ((j + q) % 8)] = ~c0[7 - ((j + q) % 8)];
            crc_byte(c0);
          end
          chk(crc !== 8'h00, "crc8 burst terdeteksi");
        end
    if (errors == 0) $display("LULUS: %0d pemeriksaan (Gray, Hamming 7,4, SECDED 8,4, CRC-8 serial)", checks);
    else $display("GAGAL: %0d kesalahan dari %0d pemeriksaan", errors, checks);
    $finish;
  end
endmodule
