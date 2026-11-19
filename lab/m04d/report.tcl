#!/usr/bin/env tclsh
# report.tcl: gaya skrip EDA dalam Tcl: proc, list, dict, foreach, regexp, lsort. Ringkasannya sama dengan logreport.py.
proc parse_rpt {fname} {
    set paths {}
    set fh [open $fname r]
    while {[gets $fh line] >= 0} {
        if {[string trim $line] eq "" || [string index $line 0] eq "#"} continue
        set d [dict create]
        foreach {all k v} [regexp -all -inline {(\w+)=(\S+)} $line] { dict set d $k $v }
        lappend paths $d
    }
    close $fh
    return $paths
}
proc by_slack {a b} {
    set x [dict get $a slack]; set y [dict get $b slack]
    expr {$x < $y ? -1 : ($x > $y ? 1 : 0)}
}
proc summary {paths} {
    set by [dict create]
    foreach p $paths { dict lappend by [dict get $p group] [dict get $p slack] }
    foreach g [lsort [dict keys $by]] {
        set sl [dict get $by $g]
        set wns [lindex [lsort -real $sl] 0]
        set nv 0
        foreach s $sl { if {$s < 0} { incr nv } }
        puts [format "%-5s %6.2f %8d %14d" $g $wns $nv [llength $sl]]
    }
}
set rpt [lindex $argv 0]
if {$rpt eq ""} { set rpt sample_timing.rpt }
set paths [parse_rpt $rpt]
puts "group  WNS    jumlah_violasi  jumlah_path"
summary $paths
set out {}
foreach p [lrange [lsort -command by_slack $paths] 0 2] {
    lappend out [format "%s(%+.2f)" [dict get $p path] [dict get $p slack]]
}
puts "3 terburuk: [join $out {, }]"
