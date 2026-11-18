// tb_and2.sv : testbench yang memeriksa dirinya sendiri
`timescale 1ns/1ps
module tb_and2;
  logic a, b;
  logic y;
  int   errors = 0;

  and2 dut (.a(a), .b(b), .y(y));

  initial begin
    $dumpfile("and2.vcd");
    $dumpvars(0, tb_and2);
    for (int i = 0; i < 4; i++) begin
      {a, b} = i[1:0];
      #10;
      if (y !== (a & b)) begin
        errors++;
        $display("GAGAL a=%b b=%b y=%b", a, b, y);
      end else begin
        $display("ok    a=%b b=%b y=%b", a, b, y);
      end
    end
    if (errors == 0) $display("LULUS: semua 4 kombinasi benar");
    else             $display("GAGAL: %0d kesalahan", errors);
    $finish;
  end
endmodule
