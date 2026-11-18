// and2.sv : gerbang AND dua masukan
module and2 (
  input  logic a,
  input  logic b,
  output logic y
);
  assign y = a & b;
endmodule
