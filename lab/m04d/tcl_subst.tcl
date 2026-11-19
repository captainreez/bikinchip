#!/usr/bin/env tclsh
# tcl_subst.tcl: Tcl memecah baris menjadi kata, lalu mengganti ($ [ ] \) SEKALI; kata pertama adalah perintah.
set x 5
set name "ani budi"
set lst {a b c}
proc cmd args { puts "[llength $args] kata: [join [lmap w $args {format <%s> $w}] { }]" }
set contoh {
    {cmd $x $name}
    {cmd "$x + 1"}
    {cmd {$x + 1}}
    {cmd [expr {$x + 1}]}
    {cmd a\ b {c d}}
    {cmd $x$x}
    {cmd "[string length $name]x"}
    {cmd {*}$lst}
    {cmd $lst}
    {cmd [string length $name] [llength $lst] [lindex $lst 1]}
}
foreach line $contoh {
    puts "% $line"
    uplevel #0 $line
}
